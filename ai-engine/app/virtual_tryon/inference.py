import asyncio
import io
import logging
from pathlib import Path

import httpx
from gradio_client import Client, handle_file
from PIL import Image

from app.core.config import get_settings
from app.core.exceptions import UpstreamError

log = logging.getLogger(__name__)

GRADIO_TIMEOUT = httpx.Timeout(
    timeout=300.0,
    connect=30.0,
    read=300.0,
    write=300.0,
    pool=30.0,
)


def _run_sync(person_path: str, garment_path: str, description: str) -> bytes:
    s = get_settings()

    try:
        if not s.tryon_space:
            raise RuntimeError("Hugging Face Space is not configured")

        client = Client(
            s.tryon_space,
            token=s.hf_token or None,
            httpx_kwargs={"timeout": GRADIO_TIMEOUT},
            verbose=False,
        )

        log.info("Connected to IDM-VTON Space: %s", s.tryon_space)
        log.info("Uploading person and garment images")

        result = client.predict(
            dict={
                "background": handle_file(person_path),
                "layers": [],
                "composite": None,
            },
            garm_img=handle_file(garment_path),
            garment_des=description,
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=42,
            api_name=s.tryon_api_name or "/tryon",
        )

        if not result:
            raise RuntimeError("IDM-VTON returned an empty result")

        output = result[0] if isinstance(result, (list, tuple)) else result

        if isinstance(output, dict):
            output = output.get("path") or output.get("url")

        if not output:
            raise RuntimeError("No generated image returned by IDM-VTON")

        log.info("IDM-VTON generated an image successfully")

        with Image.open(output) as image:
            image = image.convert("RGB")
            buffer = io.BytesIO()
            image.save(buffer, format="PNG")
            return buffer.getvalue()

    except Exception as exc:
        log.exception("IDM-VTON inference failed")
        raise UpstreamError(
            f"Virtual try-on generation failed: {exc}"
        ) from exc

    finally:
        for file_path in (person_path, garment_path):
            try:
                Path(file_path).unlink(missing_ok=True)
            except OSError:
                log.warning("Could not remove temporary file: %s", file_path)


async def run_tryon(
    person_path: str,
    garment_path: str,
    description: str = "clothing",
) -> bytes:
    return await asyncio.to_thread(
        _run_sync,
        person_path,
        garment_path,
        description,
    )
