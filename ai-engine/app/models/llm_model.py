"""LLM wrapper: Groq first, Gemini as automatic fallback."""
import logging

from app.core.exceptions import AIEngineError, UpstreamError
from app.services import gemini_service, groq_service

log = logging.getLogger(__name__)


async def generate(messages: list[dict], json_mode: bool = False, temperature: float = 0.4) -> str:
    errors: list[str] = []
    for name, svc in (("groq", groq_service), ("gemini", gemini_service)):
        try:
            return await svc.chat(messages, json_mode=json_mode, temperature=temperature)
        except AIEngineError as exc:
            log.warning("LLM provider %s failed: %s", name, exc.message)
            errors.append(f"{name}: {exc.message}")
    raise UpstreamError("All LLM providers failed -> " + " | ".join(errors))
