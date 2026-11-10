from pydantic import BaseModel, Field


class Preferences(BaseModel):
    category: str | None = None
    budget: float | None = Field(default=None, gt=0)
    color: str | None = None
    fabric: str | None = None
    occasion: str | None = None
    location: str | None = None
    previous_categories: list[str] = []
    limit: int = Field(default=6, ge=1, le=20)


class RecommendationResponse(BaseModel):
    count: int
    products: list[dict]


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(max_length=2000)


class AssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1500)
    history: list[ChatMessage] = []
    known_preferences: Preferences | None = None
    location: str | None = None


class AssistantResponse(BaseModel):
    reply: str
    preferences: Preferences
    products: list[dict] = []
