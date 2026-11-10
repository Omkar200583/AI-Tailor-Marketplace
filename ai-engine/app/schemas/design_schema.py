from pydantic import BaseModel, Field


class DesignRequest(BaseModel):
    prompt: str = Field(min_length=5, max_length=500)
    num_variations: int = Field(default=4, ge=1, le=4)
    user_id: str | None = None


class DesignItem(BaseModel):
    variation: str
    image_url: str
    public_id: str
    prompt_used: str


class DesignResponse(BaseModel):
    designs: list[DesignItem]
    failed: int = 0
