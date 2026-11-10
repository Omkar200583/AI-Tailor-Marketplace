import io

from PIL import Image

from app.image_processing.validation import is_blank


def is_valid_design(data: bytes) -> bool:
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        return False
    return min(img.size) >= 256 and not is_blank(img)
