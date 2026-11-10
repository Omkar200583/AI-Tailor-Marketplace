import io

import pytest
from PIL import Image

from app.core.exceptions import BadInputError
from app.image_processing.validation import load_validated


def test_rejects_non_image():
    with pytest.raises(BadInputError):
        load_validated(b"not an image")


def test_accepts_valid_image():
    buf = io.BytesIO()
    Image.new("RGB", (400, 500), "blue").save(buf, "PNG")
    assert load_validated(buf.getvalue()).size == (400, 500)
