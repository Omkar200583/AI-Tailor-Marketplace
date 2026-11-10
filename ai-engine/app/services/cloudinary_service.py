
import asyncio
import io
import logging
import os

import cloudinary
import cloudinary.uploader

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _configure_cloudinary():
    settings = get_settings()

    cloud_name = (
        getattr(settings, "cloudinary_cloud_name", None)
        or os.getenv("CLOUDINARY_CLOUD_NAME")
    )
    api_key = (
        getattr(settings, "cloudinary_api_key", None)
        or os.getenv("CLOUDINARY_API_KEY")
    )
    api_secret = (
        getattr(settings, "cloudinary_api_secret", None)
        or os.getenv("CLOUDINARY_API_SECRET")
    )

    if not all([cloud_name, api_key, api_secret]):
        raise RuntimeError(
            "Cloudinary configuration missing. Check your Cloudinary environment variables."
        )

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )


def _upload_sync(data: bytes, folder: str, public_id: str) -> dict:
    if not data:
        raise ValueError("Cannot upload an empty image")

    _configure_cloudinary()

    result = cloudinary.uploader.upload(
        io.BytesIO(data),
        folder=folder,
        public_id=public_id,
        resource_type="image",
        overwrite=True,
        unique_filename=False
    )

    if not result.get("secure_url"):
        raise RuntimeError("Cloudinary returned no secure image URL")

    return {
        "url": result["secure_url"],
        "secure_url": result["secure_url"],
        "public_id": result.get("public_id"),
        "format": result.get("format"),
        "width": result.get("width"),
        "height": result.get("height"),
        "bytes": result.get("bytes"),
        "resource_type": result.get("resource_type")
    }


async def upload_image(data: bytes, folder: str, public_id: str) -> dict:
    try:
        return await asyncio.to_thread(
            _upload_sync,
            data,
            folder,
            public_id
        )
    except Exception:
        logger.exception("Cloudinary image upload failed")
        raise

