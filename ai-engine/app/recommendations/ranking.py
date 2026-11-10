import math

from app.schemas.recommendation_schema import Preferences


def _as_list(v) -> list[str]:
    if v is None:
        return []
    if isinstance(v, (list, tuple, set)):
        return [str(x).lower() for x in v]
    return [str(v).lower()]


def _contains(values: list[str], wanted: str | None) -> bool:
    if not wanted:
        return False
    w = wanted.lower()
    return any(w in v or v in w for v in values)


def score_product(prod: dict, p: Preferences) -> float:
    """Weighted score in roughly 0..100."""
    score = 0.0
    if _contains(_as_list(prod.get("colors") or prod.get("color")), p.color):
        score += 25
    if _contains(_as_list(prod.get("fabric") or prod.get("material")), p.fabric):
        score += 20
    if _contains(_as_list(prod.get("occasion") or prod.get("tags")), p.occasion):
        score += 15
    if _contains(_as_list(prod.get("category")), p.category):
        score += 5

    price = prod.get("price")
    if p.budget and isinstance(price, (int, float)) and price <= p.budget:
        score += 10 * (price / p.budget)  # closer to budget = better quality tier, but never above it

    rating = prod.get("designerRating") or prod.get("rating") or 0
    score += min(float(rating), 5) / 5 * 15

    pop = prod.get("popularity") or prod.get("salesCount") or prod.get("orders") or 0
    score += min(math.log1p(float(pop)) / math.log1p(500), 1) * 7

    loc = " ".join(_as_list(prod.get("location") or prod.get("city")))
    if p.location and p.location.lower() in loc:
        score += 8

    prev = [c.lower() for c in p.previous_categories]
    if prev and _contains(_as_list(prod.get("category")), prev[0]):
        score += 3
    return round(score, 2)


def rank(products: list[dict], p: Preferences) -> list[dict]:
    for prod in products:
        prod["matchScore"] = score_product(prod, p)
    return sorted(products, key=lambda x: x["matchScore"], reverse=True)[: p.limit]
