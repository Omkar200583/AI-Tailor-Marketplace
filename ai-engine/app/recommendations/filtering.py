import re

from app.core.config import get_settings
from app.schemas.recommendation_schema import Preferences


def build_query(p: Preferences) -> dict:
    """Mongo query: hard filters only (category, budget, availability). Soft prefs are scored in ranking."""
    q: dict = {}
    if p.category:
        rx = {"$regex": re.escape(p.category), "$options": "i"}
        q["$or"] = [{"category": rx}, {"name": rx}, {"title": rx}]
    if p.budget:
        q["price"] = {"$lte": p.budget}
    if get_settings().require_available:
        q["$and"] = [{"$or": [{"stock": {"$gt": 0}}, {"isAvailable": True}, {"inStock": True}]}]
    return q
