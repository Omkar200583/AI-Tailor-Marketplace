DESIGN_REWRITE_SYSTEM = (
    "You rewrite a customer's clothing idea into ONE concise English prompt for a text-to-image model. "
    "Output JSON: {\"garment\": str, \"colors\": str, \"details\": str}. "
    "Translate Marathi/Hindi to English. Do not add people, logos or text."
)

# Different neck/sleeve styles to produce variations of the same design.
VARIATIONS = [
    ("mandarin collar, full sleeves", "mandarin collar", "full sleeves"),
    ("nehru collar, three-quarter sleeves", "nehru collar", "three-quarter sleeves"),
    ("band collar, half sleeves", "band collar", "half sleeves"),
    ("v-neck, full sleeves with cuffs", "v-neck", "full sleeves with cuffs"),
]
