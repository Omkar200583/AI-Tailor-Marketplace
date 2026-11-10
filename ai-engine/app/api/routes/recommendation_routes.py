from fastapi import APIRouter

from app.api.dependencies import protected
from app.recommendations.product_recommender import recommend
from app.schemas.recommendation_schema import Preferences, RecommendationResponse

router = APIRouter(prefix="/api/v1/recommendations", tags=["recommendations"], dependencies=protected)


@router.post("", response_model=RecommendationResponse)
async def recommendations(prefs: Preferences):
    products = await recommend(prefs)
    return RecommendationResponse(count=len(products), products=products)
