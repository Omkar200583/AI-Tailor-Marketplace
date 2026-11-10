import secrets

from fastapi import Header, HTTPException

from app.core.config import get_settings


async def verify_api_key(x_api_key: str = Header(default="")) -> None:
    """Only the Node.js backend (which knows the shared key) may call the engine."""
    expected = get_settings().internal_api_key
    if not secrets.compare_digest(x_api_key.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Invalid API key")
