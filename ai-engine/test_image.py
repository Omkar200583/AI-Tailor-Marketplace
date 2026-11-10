import asyncio
import traceback
from app.models.fashion_generator import generate_image

async def main():
    try:
        print("Testing Hugging Face FLUX image generation...")
        image = await generate_image(
            "Premium black silk men's wedding kurta with intricate golden embroidery, full front view, professional fashion photography"
        )
        print("SUCCESS: Image generated")
        print("Image size:", len(image), "bytes")

        with open("test_generated_design.png", "wb") as f:
            f.write(image)

        print("Saved: test_generated_design.png")

    except Exception as exc:
        print("IMAGE GENERATION FAILED")
        print("Error:", repr(exc))
        traceback.print_exc()

asyncio.run(main())
