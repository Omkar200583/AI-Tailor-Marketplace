from app.services import cloudinary_service


async def save_design(data: bytes, user_id: str | None, name: str) -> dict:
    return await cloudinary_service.upload_image(data, folder=f"ai-tailor/designs/{user_id or 'anon'}", public_id=name)


async def save_tryon(data: bytes, user_id: str | None, name: str) -> dict:
    return await cloudinary_service.upload_image(data, folder=f"ai-tailor/tryon/{user_id or 'anon'}", public_id=name)
