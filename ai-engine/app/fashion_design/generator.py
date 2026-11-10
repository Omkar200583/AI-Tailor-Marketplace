import asyncio
import logging
import uuid

from app.fashion_design import design_validator, prompt_builder
from app.image_processing import storage
from app.models.fashion_generator import generate_image
from app.schemas.design_schema import DesignItem, DesignRequest, DesignResponse

log = logging.getLogger(__name__)


async def _one(label: str, prompt: str, user_id: str | None) -> DesignItem | None:
    try:
        data = await generate_image(prompt)
        if not design_validator.is_valid_design(data):
            log.warning("Design '%s' failed validation", label)
            return None
        saved = await storage.save_design(data, user_id, uuid.uuid4().hex)
        return DesignItem(variation=label, image_url=saved["url"], public_id=saved["public_id"], prompt_used=prompt)
    except Exception as exc:
        log.error("Design '%s' failed: %s", label, exc)
        return None


async def generate_designs(req: DesignRequest) -> DesignResponse:
    base = await prompt_builder.base_description(req.prompt)
    prompts = prompt_builder.build_variation_prompts(base, req.num_variations)
    results = await asyncio.gather(*[_one(l, p, req.user_id) for l, p in prompts])
    designs = [r for r in results if r]
    return DesignResponse(designs=designs, failed=len(results) - len(designs))
