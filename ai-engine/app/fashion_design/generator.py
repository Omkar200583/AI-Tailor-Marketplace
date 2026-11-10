import asyncio
import logging
import uuid

from app.fashion_design import design_validator, prompt_builder
from app.image_processing import storage
from app.models.fashion_generator import generate_image
from app.schemas.design_schema import DesignItem, DesignRequest, DesignResponse

log = logging.getLogger(__name__)


async def _one(label: str, prompt: str, user_id: str | None) -> DesignItem:
    try:
        log.info("Starting design generation: %s", label)

        data = await asyncio.wait_for(
            generate_image(prompt),
            timeout=200
        )

        if not isinstance(data, bytes) or not data:
            raise RuntimeError("Image generation returned empty image data")

        log.info(
            "Image generated successfully: %s (%s bytes)",
            label,
            len(data)
        )

        if not design_validator.is_valid_design(data):
            raise RuntimeError("Generated image failed design validation")

        log.info("Image validation successful: %s", label)

        saved = await storage.save_design(
            data,
            user_id,
            uuid.uuid4().hex
        )

        if not saved or not saved.get("url"):
            raise RuntimeError("Cloudinary did not return an image URL")

        log.info("Design uploaded successfully: %s", label)

        return DesignItem(
            variation=label,
            image_url=saved["url"],
            public_id=saved["public_id"],
            prompt_used=prompt
        )

    except Exception:
        log.exception("Design generation failed at variation: %s", label)
        raise


async def generate_designs(req: DesignRequest) -> DesignResponse:
    try:
        log.info("Preparing design prompt")

        base = await prompt_builder.base_description(req.prompt)

        if not base.strip():
            raise RuntimeError("Could not create a valid design description")

        prompts = prompt_builder.build_variation_prompts(
            base,
            req.num_variations
        )

        if not prompts:
            raise RuntimeError("No design variation prompts were created")

        log.info("Starting generation of %s design(s)", len(prompts))

        designs = []

        for label, prompt in prompts:
            design = await _one(label, prompt, req.user_id)
            designs.append(design)

        log.info("Successfully generated %s designs", len(designs))

        return DesignResponse(
            designs=designs,
            failed=0
        )

    except Exception:
        log.exception("AI design generation pipeline failed")
        raise
