from fastapi import APIRouter

from app.api.dependencies import protected
from app.fashion_design.generator import generate_designs
from app.schemas.design_schema import DesignRequest, DesignResponse

router = APIRouter(prefix="/api/v1/design", tags=["fashion-design"], dependencies=protected)


@router.post("/generate", response_model=DesignResponse)
async def generate(req: DesignRequest):
    return await generate_designs(req)
