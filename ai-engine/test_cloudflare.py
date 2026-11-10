import asyncio

from app.services.cloudflare_service import text_to_image


async def main():
    prompt = (
        "Professional fashion catalogue photograph of a premium "
        "black Indian men's wedding kurta, intricate golden embroidery "
        "on the collar and chest, luxurious silk fabric, elegant "
        "traditional Indian fashion, complete garment visible, "
        "front view, realistic fabric texture, studio lighting, "
        "clean white background."
    )

    print("Connecting to Cloudflare FLUX...")
    print("Generating fashion design...")

    image = await text_to_image(prompt)

    with open("cloudflare_test.jpg", "wb") as file:
        file.write(image)

    print("SUCCESS: Image generated!")
    print("File: cloudflare_test.jpg")
    print("Image size:", len(image), "bytes")


if __name__ == "__main__":
    asyncio.run(main())