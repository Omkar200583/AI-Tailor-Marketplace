from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

_client: AsyncIOMotorClient | None = None


def connect() -> None:
    global _client
    s = get_settings()
    _client = AsyncIOMotorClient(s.mongodb_uri, serverSelectionTimeoutMS=5000)


def close() -> None:
    if _client:
        _client.close()


def get_db() -> AsyncIOMotorDatabase:
    if _client is None:
        connect()
    return _client[get_settings().mongodb_db]  # type: ignore[index]


async def ping() -> bool:
    try:
        await get_db().command("ping")
        return True
    except Exception:
        return False


def serialize(doc: dict) -> dict:
    """Make a Mongo document JSON-safe (ObjectId -> str)."""
    out = {}
    for k, v in doc.items():
        if k == "_id" or v.__class__.__name__ == "ObjectId":
            out["id" if k == "_id" else k] = str(v)
        else:
            out[k] = v
    return out
