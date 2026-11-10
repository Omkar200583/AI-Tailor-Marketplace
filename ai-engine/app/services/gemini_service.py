from google import genai
from google.genai import types

from app.core.config import get_settings
from app.core.exceptions import ConfigError, UpstreamError


async def chat(messages: list[dict], json_mode: bool = False, temperature: float = 0.4) -> str:
    s = get_settings()
    if not s.gemini_api_key:
        raise ConfigError("GEMINI_API_KEY is missing")
    client = genai.Client(api_key=s.gemini_api_key)

    system = "\n".join(m["content"] for m in messages if m["role"] == "system")
    contents = [
        types.Content(
            role="user" if m["role"] == "user" else "model",
            parts=[types.Part(text=m["content"])],
        )
        for m in messages
        if m["role"] != "system"
    ]
    config = types.GenerateContentConfig(
        system_instruction=system or None,
        temperature=temperature,
        response_mime_type="application/json" if json_mode else "text/plain",
    )
    try:
        res = await client.aio.models.generate_content(
            model=s.gemini_model, contents=contents, config=config
        )
        return res.text or ""
    except Exception as exc:
        raise UpstreamError(f"Gemini request failed: {exc}") from exc
