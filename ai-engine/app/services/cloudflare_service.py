import asyncio
import base64
import json
import logging
import urllib.error
import urllib.request

from app.core.config import get_settings

logger = logging.getLogger(__name__)

MODEL = "@cf/black-forest-labs/flux-1-schnell"


def _generate_sync(prompt: str) -> bytes:
    settings = get_settings()

    if not settings.cloudflare_account_id:
        raise RuntimeError("CLOUDFLARE_ACCOUNT_ID is missing")

    if not settings.cloudflare_api_token:
        raise RuntimeError("CLOUDFLARE_API_TOKEN is missing")

    url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{settings.cloudflare_account_id}/ai/run/{MODEL}"
    )

    payload = {
        "prompt": prompt,
        "steps": 4
    }

    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.cloudflare_api_token}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        logger.info("Sending image generation request to Cloudflare")

        with urllib.request.urlopen(request, timeout=180) as response:
            logger.info("Cloudflare response status: %s", response.status)
            result = json.loads(response.read().decode("utf-8"))

        logger.info("Cloudflare response received")

        if not result.get("success", False):
            raise RuntimeError(
                f"Cloudflare API error: {result.get('errors', result)}"
            )

        image_base64 = result.get("result", {}).get("image")

        if not image_base64:
            raise RuntimeError("Cloudflare returned no generated image")

        image_bytes = base64.b64decode(image_base64, validate=True)

        if not image_bytes:
            raise RuntimeError("Generated image is empty")

        logger.info("Cloudflare image decoded successfully: %s bytes", len(image_bytes))

        return image_bytes

    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        logger.error("Cloudflare HTTP error %s: %s", exc.code, error_body)

        raise RuntimeError(
            f"Cloudflare HTTP {exc.code}: {error_body}"
        ) from exc

    except urllib.error.URLError as exc:
        logger.exception("Cloudflare connection failed")

        raise RuntimeError(
            f"Cloudflare connection failed: {exc.reason}"
        ) from exc


async def text_to_image(prompt: str) -> bytes:
    if not prompt or not prompt.strip():
        raise ValueError("Fashion design prompt cannot be empty")

    return await asyncio.to_thread(_generate_sync, prompt)
