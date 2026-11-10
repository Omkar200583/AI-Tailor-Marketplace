import uuid

from fastapi import APIRouter, File, Form, UploadFile

from app.api.dependencies import protected
from app.core.exceptions import BadInputError
from app.image_processing import storage
from app.models.virtual_tryon import try_on
from app.schemas.tryon_schema import TryOnResponse

router = APIRouter(prefix="/api/v1/tryon", tags=["virtual-tryon"], dependencies=protected)


@router.post("", response_model=TryOnResponse)
async def tryon(
    person_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    description: str = Form("clothing"),
    user_id: str | None = Form(None),
):
    person = await person_image.read()
    garment = await garment_image.read()
    if not person or not garment:
        raise BadInputError("Both person_image and garment_image are required")
    result = await try_on(person, garment, description[:120])
    saved = await storage.save_tryon(result, user_id, uuid.uuid4().hex)
    return TryOnResponse(result_url=saved["url"], public_id=saved["public_id"])
