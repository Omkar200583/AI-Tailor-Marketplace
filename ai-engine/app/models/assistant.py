import json
import logging

from app.models import llm_model
from app.prompt_engine import assistant_prompts as ap
from app.recommendations import product_recommender
from app.schemas.recommendation_schema import AssistantRequest, AssistantResponse, Preferences

log = logging.getLogger(__name__)

# Only these fields are shown to the LLM, so it cannot see/invent anything else.
SAFE_FIELDS = ("id", "name", "title", "price", "category", "colors", "color", "fabric", "location", "designerRating")


def _slim(p: dict) -> dict:
    return {k: p[k] for k in SAFE_FIELDS if k in p}


def _history(req: AssistantRequest) -> list[dict]:
    return [m.model_dump() for m in req.history[-8:]] + [{"role": "user", "content": req.message}]


async def _extract(req: AssistantRequest) -> tuple[Preferences, bool]:
    known = (req.known_preferences or Preferences()).model_dump(exclude={"limit", "previous_categories"})
    msgs = [{"role": "system", "content": ap.EXTRACT_SYSTEM + f" Known so far: {json.dumps(known)}"}]
    msgs += _history(req)
    try:
        d = json.loads(await llm_model.generate(msgs, json_mode=True, temperature=0))
    except Exception as exc:
        log.warning("Preference extraction failed: %s", exc)
        return (req.known_preferences or Preferences()), False
    prefs = Preferences(
        category=d.get("category"),
        budget=d.get("budget") if isinstance(d.get("budget"), (int, float)) and d["budget"] > 0 else None,
        color=d.get("color"),
        fabric=d.get("fabric"),
        occasion=d.get("occasion"),
        location=d.get("location") or req.location,
        previous_categories=(req.known_preferences.previous_categories if req.known_preferences else []),
    )
    return prefs, bool(d.get("ready_to_search"))


async def respond(req: AssistantRequest) -> AssistantResponse:
    prefs, ready = await _extract(req)

    if not ready:
        reply = await llm_model.generate(
            [{"role": "system", "content": ap.ASK_SYSTEM + f" Known: {prefs.model_dump_json()}"}] + _history(req)
        )
        return AssistantResponse(reply=reply, preferences=prefs)

    products = await product_recommender.recommend(prefs)
    ctx = f"PREFERENCES: {prefs.model_dump_json()}\nPRODUCTS: {json.dumps([_slim(p) for p in products], default=str)}"
    reply = await llm_model.generate(
        [{"role": "system", "content": ap.REPLY_SYSTEM + "\n" + ctx}] + _history(req)
    )
    return AssistantResponse(reply=reply, preferences=prefs, products=products)
