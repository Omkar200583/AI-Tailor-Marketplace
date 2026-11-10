import dotenv from "dotenv";
dotenv.config();

const get = (key: string, fallback?: string): string => {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`Missing environment variable: ${key}`);
  return v;
};

export const env = {
  NODE_ENV: get("NODE_ENV", "development"),
  PORT: Number(get("PORT", "5000")),
  MONGO_URI: get("MONGO_URI", "mongodb://127.0.0.1:27017/ai_tailor_db"),
  JWT_SECRET: get("JWT_SECRET", "dev-secret-change-me"),
  JWT_EXPIRES_IN: get("JWT_EXPIRES_IN", "7d"),
  CLIENT_URL: get("CLIENT_URL", "http://localhost:3000"),
  AI_ENGINE_URL: get("AI_ENGINE_URL", "http://localhost:8000"),
  RAZORPAY_KEY_ID: get("RAZORPAY_KEY_ID", ""),
  RAZORPAY_KEY_SECRET: get("RAZORPAY_KEY_SECRET", ""),
  RAZORPAY_WEBHOOK_SECRET: get("RAZORPAY_WEBHOOK_SECRET", ""),
  COMMISSION_PERCENT: Number(get("COMMISSION_PERCENT", "10")),
  isProd: get("NODE_ENV", "development") === "production",
};
