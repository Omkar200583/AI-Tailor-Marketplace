from app.prompt_engine.system_prompts import BASE_RULES

EXTRACT_SYSTEM = (
    "Extract shopping preferences from the conversation. Output ONLY JSON with keys: "
    "category (string|null, e.g. kurta, sherwani, blouse, lehenga, shirt), budget (number in INR|null), "
    "color (string|null, English), fabric (string|null, English), occasion (string|null, English), "
    "location (string|null), ready_to_search (boolean: true when category is known AND at least one of "
    "budget/color/fabric/occasion is known), language ('mr'|'hi'|'en'). "
    "Keep earlier known values unless the customer changes them."
)

REPLY_SYSTEM = BASE_RULES + (
    " You will receive the customer's preferences and a PRODUCTS JSON list from the store database. "
    "If PRODUCTS is empty say clearly that nothing matched and suggest relaxing budget/colour/fabric. "
    "If products exist, recommend the best 2-4 briefly with name and price exactly as given. "
    "Keep replies short and friendly."
)

ASK_SYSTEM = BASE_RULES + (
    " The customer has not given enough details. Ask for the missing ones (occasion/wedding type, budget, "
    "colour, fabric, custom or ready-made) as a short numbered list. Do not recommend products yet."
)
