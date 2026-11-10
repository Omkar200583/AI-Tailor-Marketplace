import tempfile
from pathlib import Path

from app.image_processing.resize import fit_within, resize_to_ratio
from app.image_processing.validation import load_validated


def prepare_pair(person_bytes: bytes, garment_bytes: bytes) -> tuple[str, str]:
    """Validate + normalise both images and write temp files for the try-on model."""
    person = resize_to_ratio(load_validated(person_bytes, min_side=300))
    garment = resize_to_ratio(fit_within(load_validated(garment_bytes, min_side=200)))
    tmp = Path(tempfile.mkdtemp(prefix="tryon_"))
    p, g = tmp / "person.png", tmp / "garment.png"
    person.save(p)
    garment.save(g)
    return str(p), str(g)
