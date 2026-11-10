import logging

from fastapi import APIRouter, HTTPException

from app.api.dependencies import protected
from app.fashion_design.generator import generate_designs
from app.schemas.design_schema import DesignRequest, DesignResponse

log = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/design",
    tags=["fashion-design"],
    dependencies=protected
)


@router.post("/generate", response_model=DesignResponse)
async def generate(req: DesignRequest):
    try:
        return await generate_designs(req)

    except Exception as exc:
        log.exception("Fashion design API failed")

        raise HTTPException(
            status_code=502,
            detail=f"Design generation failed: {type(exc).__name__}"
        ) from exc
