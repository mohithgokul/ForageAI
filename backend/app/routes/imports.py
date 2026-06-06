import csv
import io
import json
import re
import asyncio
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from app import db
from app.dependencies import get_current_user
from app.sql_builder import get_table_name

router = APIRouter(prefix="/api/apps", tags=["import"])

# Temp store for error reports keyed by (app_id, table_name)
_error_cache: dict[str, list] = {}


async def _get_app_and_table(app_id: str, user_id: str, table_name: str):
    app = await db.fetchrow('SELECT * FROM "App" WHERE id = $1', app_id)
    if not app:
        raise HTTPException(404, {"error": "NOT_FOUND", "message": "App not found"})
    if app["userId"] != user_id:
        raise HTTPException(403, {"error": "FORBIDDEN", "message": "Not authorized"})
    config = app["config"] if isinstance(app["config"], dict) else json.loads(app["config"])
    table_cfg = next((t for t in config.get("tables", []) if t["name"] == table_name), None)
    if not table_cfg:
        raise HTTPException(404, {"error": "TABLE_NOT_FOUND", "message": "Table not found"})
    return app, table_cfg


@router.post("/{app_id}/import/{table_name}")
async def import_csv(
    app_id: str,
    table_name: str,
    file: UploadFile = File(...),
    mapping: str = Form(...),
    current_user: dict = Depends(get_current_user),
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(400, {"error": "BAD_REQUEST", "message": "File must be a .csv"})

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, {"error": "FILE_TOO_LARGE", "message": "File must be under 10 MB"})

    col_mapping: dict = json.loads(mapping)
    _, table_cfg = await _get_app_and_table(app_id, current_user["id"], table_name)
    fields = {f["name"]: f for f in table_cfg.get("fields", [])}

    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
    rows = list(reader)

    errors: list[dict] = []
    valid_rows: list[dict] = []

    for i, row in enumerate(rows):
        mapped: dict = {}
        for csv_col, config_field in col_mapping.items():
            mapped[config_field] = row.get(csv_col, "")

        row_errors = []
        for fname, field in fields.items():
            val = mapped.get(fname)
            if field.get("required") and not val:
                row_errors.append({"field": fname, "message": "Required field is empty"})
            if val:
                if field["type"] == "number":
                    try:
                        float(val)
                    except ValueError:
                        row_errors.append({"field": fname, "message": "Must be a number"})
                if field["type"] == "email" and not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", val):
                    row_errors.append({"field": fname, "message": "Invalid email"})

        if row_errors:
            errors.append({"row": i + 2, "original": row, "errors": row_errors})
        else:
            valid_rows.append(mapped)

    # Batch insert valid rows
    tbl = get_table_name(app_id, table_name)
    inserted = 0
    for mapped_row in valid_rows:
        keys = [re.sub(r"[^a-z0-9_]", "", k, flags=re.IGNORECASE) for k in mapped_row.keys()]
        vals = list(mapped_row.values())
        if not keys:
            continue
        placeholders = ", ".join(f"${j+1}" for j in range(len(vals)))
        cols = ", ".join(f'"{k}"' for k in keys)
        try:
            await db.execute(
                f'INSERT INTO "{tbl}" ({cols}) VALUES ({placeholders})',
                *vals,
            )
            inserted += 1
        except Exception as e:
            print(f"Import insert error: {e}")

    # Cache errors for download endpoint
    cache_key = f"{app_id}:{table_name}"
    _error_cache[cache_key] = errors

    await db.execute(
        'INSERT INTO "ActivityLog" ("appId", event, "tableName", metadata) VALUES ($1,$2,$3,$4)',
        app_id, "csv_imported", table_name,
        json.dumps({"totalRows": len(rows), "insertedRows": inserted, "skippedRows": len(errors)}),
    )

    return {"inserted": inserted, "skipped": len(errors), "errors": errors}


@router.get("/{app_id}/import/{table_name}/errors")
async def download_errors(
    app_id: str,
    table_name: str,
    current_user: dict = Depends(get_current_user),
):
    await _get_app_and_table(app_id, current_user["id"], table_name)
    cache_key = f"{app_id}:{table_name}"
    errors = _error_cache.get(cache_key, [])

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["row", "error_reason", "original_data"])
    for e in errors:
        reasons = "; ".join(f"{err['field']}: {err['message']}" for err in e.get("errors", []))
        writer.writerow([e["row"], reasons, json.dumps(e.get("original", {}))])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=import-errors-{table_name}.csv"},
    )
