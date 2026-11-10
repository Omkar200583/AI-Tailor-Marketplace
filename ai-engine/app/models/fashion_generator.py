from app.services import cloudflare_service

async def generate_image(prompt: str) -> bytes:
    return await cloudflare_service.text_to_image(prompt)
