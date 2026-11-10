from app.virtual_tryon import inference, preprocessing


async def try_on(person_bytes: bytes, garment_bytes: bytes, description: str) -> bytes:
    person_path, garment_path = preprocessing.prepare_pair(person_bytes, garment_bytes)
    return await inference.run_tryon(person_path, garment_path, description)
