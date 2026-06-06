import psycopg2
import psycopg2.extras
import psycopg2.pool
from app.config import settings

_pool: psycopg2.pool.ThreadedConnectionPool | None = None


def get_pool() -> psycopg2.pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        dsn = settings.DATABASE_URL
        # Neon (and most managed PG) require SSL — add if not already present
        if "sslmode" not in dsn:
            dsn = dsn + ("&" if "?" in dsn else "?") + "sslmode=require"
        _pool = psycopg2.pool.ThreadedConnectionPool(2, 10, dsn=dsn)
    return _pool


def close_pool():
    global _pool
    if _pool:
        _pool.closeall()
        _pool = None


import re


def _to_psycopg2(query: str) -> str:
    """Convert PostgreSQL $1, $2, ... placeholders to psycopg2 %s style."""
    return re.sub(r"\$\d+", "%s", query)


def _execute_query(query: str, params=None, fetch: str = "none"):
    """
    fetch: "all" | "one" | "val" | "none"
    Automatically converts $1/$2/... to %s for psycopg2 compatibility.
    """
    pool = get_pool()
    conn = pool.getconn()
    try:
        if conn.closed:
            conn = pool.getconn()
            
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(_to_psycopg2(query), params)
            conn.commit()
            if fetch == "all":
                return cur.fetchall()
            elif fetch == "one":
                return cur.fetchone()
            elif fetch == "val":
                row = cur.fetchone()
                if row:
                    return list(row.values())[0]
                return None
            return None
    except psycopg2.InterfaceError:
        # Reconnect on closed connection (e.g. Neon scale to zero)
        pool.putconn(conn, close=True)
        conn = pool.getconn()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(_to_psycopg2(query), params)
            conn.commit()
            if fetch == "all":
                return cur.fetchall()
            elif fetch == "one":
                return cur.fetchone()
            elif fetch == "val":
                row = cur.fetchone()
                if row:
                    return list(row.values())[0]
                return None
            return None
    except Exception:
        if not conn.closed:
            conn.rollback()
        raise
    finally:
        if not conn.closed:
            pool.putconn(conn)


import asyncio
from functools import partial


async def _run(func, *args, **kwargs):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(func, *args, **kwargs))


async def fetch(query: str, *args):
    rows = await _run(_execute_query, query, args or None, "all")
    return [dict(r) for r in (rows or [])]


async def fetchrow(query: str, *args):
    row = await _run(_execute_query, query, args or None, "one")
    return dict(row) if row else None


async def fetchval(query: str, *args):
    return await _run(_execute_query, query, args or None, "val")


async def execute(query: str, *args):
    await _run(_execute_query, query, args or None, "none")


async def executemany(query: str, args_list: list):
    pool = get_pool()
    loop = asyncio.get_event_loop()

    def _do():
        conn = pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.executemany(_to_psycopg2(query), args_list)
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            pool.putconn(conn)

    await loop.run_in_executor(None, _do)
