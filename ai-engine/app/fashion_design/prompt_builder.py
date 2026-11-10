import asyncio
import json
import logging

from app.models import llm_model
from app.prompt_engine.fashion_prompts import DESIGN_REWRITE_SYSTEM, VARIATIONS

log = logging.getLogger(__name__)

STYLE_SUFFIX = (
    "product photography of a single garment on a plain light background, front view, "
    "high detail fabric texture, studio lighting, no person, no text, no watermark"
)


async def base_description(user_prompt: str) -> str:
    try:
        log.info("Starting AI prompt rewrite")

        raw = await asyncio.wait_for(
            llm_model.generate(
                [
                    {"role": "system", "content": DESIGN_REWRITE_SYSTEM},
                    {"role": "user", "content": user_prompt}
                ],
                json_mode=True,
                temperature=0.2,
            ),
            timeout=20
        )

        data = json.loads(raw)

        description = (
            f"{data.get('colors', '')} "
            f"{data.get('garment', '')}, "
            f"{data.get('details', '')}"
        ).strip(" ,")

        if description:
            log.info("AI prompt rewrite completed")
            return description

        log.warning("AI returned an empty description; using original prompt")
        return user_prompt

    except Exception:
        log.exception("AI prompt rewrite failed; using original prompt")
        return user_prompt


def build_variation_prompts(base: str, n: int) -> list[tuple[str, str]]:
    output = []

    for label, collar, sleeve in VARIATIONS[:n]:
        prompt = (
            f"{base}, {collar}, {sleeve}, "
            f"traditional Indian tailoring, {STYLE_SUFFIX}"
        )
        output.append((label, prompt))

    log.info("Created %s design variation prompts", len(output))

    return output
