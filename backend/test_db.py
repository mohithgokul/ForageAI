import asyncio, sys
sys.path.insert(0, '.')
from app import db

async def test():
    # Test $1 -> %s conversion
    q = 'SELECT id FROM "User" WHERE email = $1'
    try:
        result = await db.fetchrow(q, 'test@example.com')
        print('DB query OK:', result)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
