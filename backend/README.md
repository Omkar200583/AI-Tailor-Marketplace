# AI Tailor – Backend

Node.js + Express + TypeScript + MongoDB (Mongoose) + JWT + Socket.IO

## Run
```bash
cd backend
cp .env.example .env        # fill values
npm install
npm run seed                # categories + admin user (admin@aitailor.local / ChangeMe@123)
npm run dev                 # http://localhost:5000/api/v1
```
Docker: `docker compose up --build` from the repo root.

## Order flow
cart -> `POST /orders` (one order per seller, status `pending_approval`)
-> seller `PATCH /seller/requests/:id/approve|reject`
-> customer `POST /payments/create-order` + `/verify` (Razorpay; webhook is `/payments/webhook`)
-> status `confirmed` -> seller `PATCH /seller/orders/:id/status` (stitching > ready > shipped > delivered)
-> customer can review.  Platform commission is recorded on payment; admin bundles it into seller payouts.

## AI flow
`POST /ai/design/generate` and `POST /tryon/generate` call the Python ai-engine
(`AI_ENGINE_URL`, paths `/api/v1/design/generate` and `/api/v1/tryon/generate` – edit in `modules/designs` and `modules/tryon`).

## Socket.IO
Connect with `auth: { token }`. Events: `conversation:join`, `message:send`, `typing`, `message:read`;
server emits `message:new`, `conversation:updated`, `notification:new`.

## Notes
- OTPs are logged to the console (and returned as `devOtp` outside production). Plug an SMS/email provider into `utils/otp.ts`.
- Uploads are stored on local disk (`/uploads`); swap `middleware/upload.ts` for S3/Cloudinary in production.
- Order creation does not use Mongo transactions (they need a replica set); enable them if you run one.
