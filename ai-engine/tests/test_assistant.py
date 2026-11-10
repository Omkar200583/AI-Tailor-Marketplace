from app.models.assistant import _slim


def test_llm_only_sees_safe_fields():
    prod = {"id": "1", "name": "Kurta", "price": 999, "sellerPhone": "9999999999", "internalCost": 400}
    slim = _slim(prod)
    assert "sellerPhone" not in slim and "internalCost" not in slim
    assert slim["price"] == 999
