"""
Person segmentation is performed inside the try-on model pipeline (IDM-VTON / CatVTON use their own
human-parsing + DensePose). If you later self-host the model on your own GPU, plug SCHP here.
"""


def segmentation_handled_by_model() -> bool:
    return True
