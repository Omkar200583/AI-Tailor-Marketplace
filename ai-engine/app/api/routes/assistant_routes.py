from fastapi import APIRouter

from app.api.dependencies import protected
from app.models.assistant import respond
from app.schemas.recommendation_schema import AssistantRequest, AssistantResponse

router = APIRouter(prefix="/api/v1/assistant", tags=["assistant"], dependencies=protected)


@router.post("/chat", response_model=AssistantResponse)
async def chat(req: AssistantRequest):
    return await respond(req)
