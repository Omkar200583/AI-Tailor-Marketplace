from app.recommendations.ranking import rank, score_product
from app.schemas.recommendation_schema import Preferences


def test_matching_product_ranks_first():
    p = Preferences(category="kurta", budget=1500, color="blue", fabric="cotton", limit=2)
    good = {"name": "Blue Kurta", "category": "kurta", "price": 1400, "colors": ["Blue"], "fabric": "Cotton", "designerRating": 4.5}
    bad = {"name": "Red Kurta", "category": "kurta", "price": 900, "colors": ["Red"], "fabric": "Silk", "designerRating": 4.9}
    assert rank([bad, good], p)[0]["name"] == "Blue Kurta"
    assert score_product(good, p) > score_product(bad, p)
