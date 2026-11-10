import asyncio
import io

from huggingface_hub import InferenceClient
from PIL import Image

from app.core.config import get_settings
from app.core.exceptions import ConfigError, UpstreamError


def _generate_sync(prompt: str, seed: int | None) -> Image.Image:
    s = get_settings()
    if not s.hf_token:
        raise ConfigError("HF_TOKEN is missing")
    client = InferenceClient(token=s.hf_token)
    try:
        return client.text_to_image(prompt, model=s.image_model, seed=seed)
    except Exception as exc:
        raise UpstreamError(f"Hugging Face image generation failed: {exc}") from exc


async def text_to_image(prompt: str, seed: int | None = None) -> bytes:
    img = await asyncio.to_thread(_generate_sync, prompt, seed)
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="PNG")
    return buf.getvalue()
