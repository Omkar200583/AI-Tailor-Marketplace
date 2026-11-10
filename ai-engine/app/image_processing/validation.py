import io

from PIL import Image, ImageStat, UnidentifiedImageError

from app.core.config import get_settings
from app.core.exceptions import BadInputError

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


def load_validated(data: bytes, min_side: int = 256) -> Image.Image:
    """Validate an uploaded image and return it as RGB."""
    limit = get_settings().max_upload_mb * 1024 * 1024
    if len(data) > limit:
        raise BadInputError(f"Image is larger than {get_settings().max_upload_mb} MB")
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
        img = Image.open(io.BytesIO(data))
    except (UnidentifiedImageError, OSError) as exc:
        raise BadInputError("File is not a valid image") from exc
    if img.format not in ALLOWED_FORMATS:
        raise BadInputError("Only JPEG, PNG or WEBP images are allowed")
    if min(img.size) < min_side:
        raise BadInputError(f"Image is too small (min {min_side}px)")
    return img.convert("RGB")


def is_blank(img: Image.Image) -> bool:
    """Detect (almost) single-colour images that image models sometimes return."""
    stat = ImageStat.Stat(img.convert("L"))
    return stat.stddev[0] < 6
