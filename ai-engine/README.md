# AI Tailor – AI Engine (FastAPI)

Python microservice called by the Node.js backend. Modules: Fashion Design, Virtual Try-On, Assistant, Recommendations.

## Setup
```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env     # fill keys
uvicorn app.main:app --reload --port 8000
pytest                   # offline unit tests
```
Docs: http://localhost:8000/docs  (send header `x-api-key: <INTERNAL_API_KEY>`)

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | /health | Status + MongoDB ping |
| POST | /api/v1/design/generate | `{prompt, num_variations, user_id}` -> Cloudinary design URLs |
| POST | /api/v1/tryon | multipart: person_image, garment_image, description, user_id |
| POST | /api/v1/assistant/chat | `{message, history, known_preferences}` -> reply + real Mongo products |
| POST | /api/v1/recommendations | `{category, budget, color, fabric, occasion, location}` |

## Keys needed (all have free tiers)
Groq (console.groq.com), Gemini (aistudio.google.com), Hugging Face token (huggingface.co/settings/tokens), Cloudinary, MongoDB.

## MongoDB product fields
Engine reads: `name|title, category, price, colors|color, fabric|material, occasion|tags, designerRating|rating,
popularity|salesCount, location|city, stock|isAvailable|inStock`. Edit `recommendations/filtering.py` and
`ranking.py` if your schema differs. Set `REQUIRE_AVAILABLE=false` to skip the stock filter.

## Node.js integration
```js
// npm i axios form-data
const axios = require("axios");
const FormData = require("form-data");
const AI = axios.create({ baseURL: process.env.AI_ENGINE_URL, headers: { "x-api-key": process.env.AI_ENGINE_KEY }, timeout: 120000 });

exports.generateDesign = (prompt, userId) => AI.post("/api/v1/design/generate", { prompt, num_variations: 4, user_id: userId }).then(r => r.data);
exports.chat = (message, history, known) => AI.post("/api/v1/assistant/chat", { message, history, known_preferences: known }).then(r => r.data);

exports.tryOn = (personBuf, garmentBuf, userId) => {
  const fd = new FormData();
  fd.append("person_image", personBuf, "person.png");
  fd.append("garment_image", garmentBuf, "garment.png");
  fd.append("user_id", userId);
  return AI.post("/api/v1/tryon", fd, { headers: fd.getHeaders() }).then(r => r.data);
};
```

## Important notes
- **License:** IDM-VTON and CatVTON are CC BY-NC-SA 4.0 (non-commercial). Fine for prototype/college project; get a commercial license or another model before earning money.
- **Try-on** uses a free Hugging Face Space: slow (30-120 s), queue/quota limits. Run `Client(space).view_api()` if the Space API changes and update `virtual_tryon/inference.py`. For production use your own GPU.
- Try-on is only an approximate visual preview, not a fit guarantee.
- The assistant sees only whitelisted product fields from MongoDB and is told never to invent price/stock.
- Do NOT expose this service to browsers; only the Node.js backend should call it.
