import io

from PIL import Image, ImageOps


def fit_within(img: Image.Image, max_side: int = 1024) -> Image.Image:
    img = ImageOps.exif_transpose(img)
    img.thumbnail((max_side, max_side), Image.LANCZOS)
    return img


def resize_to_ratio(img: Image.Image, size: tuple[int, int] = (768, 1024)) -> Image.Image:
    """Crop/resize to the 3:4 portrait ratio used by try-on models."""
    return ImageOps.fit(ImageOps.exif_transpose(img), size, Image.LANCZOS)


def to_bytes(img: Image.Image, fmt: str = "PNG") -> bytes:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()
