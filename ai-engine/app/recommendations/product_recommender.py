from app.core.config import get_settings
from app.recommendations import filtering, ranking
from app.schemas.recommendation_schema import Preferences
from app.services import mongodb_service


async def recommend(p: Preferences) -> list[dict]:
    col = mongodb_service.get_db()[get_settings().products_collection]
    cursor = col.find(filtering.build_query(p)).limit(300)
    docs = [mongodb_service.serialize(d) async for d in cursor]
    return ranking.rank(docs, p)
