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
    """Use the LLM to translate/clean the user's idea; fall back to the raw prompt."""
    try:
        raw = await llm_model.generate(
            [{"role": "system", "content": DESIGN_REWRITE_SYSTEM}, {"role": "user", "content": user_prompt}],
            json_mode=True,
            temperature=0.2,
        )
        d = json.loads(raw)
        return f"{d.get('colors', '')} {d.get('garment', '')}, {d.get('details', '')}".strip(" ,")
    except Exception as exc:  # LLM is optional here
        log.warning("Prompt rewrite skipped: %s", exc)
        return user_prompt


def build_variation_prompts(base: str, n: int) -> list[tuple[str, str]]:
    out = []
    for label, collar, sleeve in VARIATIONS[:n]:
        out.append((label, f"{base}, {collar}, {sleeve}, traditional Indian tailoring, {STYLE_SUFFIX}"))
    return out
