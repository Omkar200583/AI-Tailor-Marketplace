"""Garment masking is also handled inside the try-on model. Kept as an extension point for self-hosting."""


def segmentation_handled_by_model() -> bool:
    return True
