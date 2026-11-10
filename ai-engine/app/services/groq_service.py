from groq import AsyncGroq

from app.core.config import get_settings
from app.core.exceptions import ConfigError, UpstreamError


async def chat(messages: list[dict], json_mode: bool = False, temperature: float = 0.4) -> str:
    s = get_settings()
    if not s.groq_api_key:
        raise ConfigError("GROQ_API_KEY is missing")
    client = AsyncGroq(api_key=s.groq_api_key)
    kwargs = {"response_format": {"type": "json_object"}} if json_mode else {}
    try:
        res = await client.chat.completions.create(
            model=s.groq_model, messages=messages, temperature=temperature, max_tokens=900, **kwargs
        )
        return res.choices[0].message.content or ""
    except Exception as exc:
        raise UpstreamError(f"Groq request failed: {exc}") from exc
