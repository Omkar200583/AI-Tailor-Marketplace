import io

from PIL import Image

from app.fashion_design.design_validator import is_valid_design
from app.fashion_design.prompt_builder import build_variation_prompts


def _png(color, size=(512, 512), noise=False):
    img = Image.new("RGB", size, color)
    if noise:
        for x in range(0, 512, 4):
            for y in range(0, 512, 4):
                img.putpixel((x, y), (x % 255, y % 255, (x * y) % 255))
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()


def test_blank_image_rejected():
    assert not is_valid_design(_png((255, 255, 255)))


def test_detailed_image_accepted():
    assert is_valid_design(_png((10, 10, 10), noise=True))


def test_variations_have_distinct_prompts():
    prompts = build_variation_prompts("black wedding kurta golden embroidery", 4)
    assert len({p for _, p in prompts}) == 4
