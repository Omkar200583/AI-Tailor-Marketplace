from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AI Tailor AI Engine"
    internal_api_key: str = "dev-key"

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "ai_tailor"
    products_collection: str = "products"
    require_available: bool = True

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    hf_token: str = ""
    image_model: str = "black-forest-labs/FLUX.1-schnell"
    tryon_space: str = "yisol/IDM-VTON"
    tryon_api_name: str = "/tryon"

    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    cloudflare_account_id: str = ""
    cloudflare_api_token: str = ""

    max_upload_mb: int = 8
    internal_api_key: str = "dev-key"

@lru_cache
def get_settings() -> Settings:
    return Settings()
