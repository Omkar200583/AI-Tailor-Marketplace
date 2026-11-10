from fastapi import APIRouter

from app.services import mongodb_service

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok", "mongodb": await mongodb_service.ping()}
