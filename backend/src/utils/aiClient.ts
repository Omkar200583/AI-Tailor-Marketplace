import axios from "axios";
import { env } from "../config/env";
import { ApiError } from "./ApiError";

const client = axios.create({ baseURL: env.AI_ENGINE_URL, timeout: 120000 });

// Calls the Python ai-engine (FastAPI). Adjust paths to match your engine routes.
export const callAiEngine = async <T = any>(path: string, payload: unknown): Promise<T> => {
  try {
    const { data } = await client.post(path, payload);
    return data as T;
  } catch (err: any) {
    const msg = err?.response?.data?.detail || err?.message || "AI engine error";
    throw new ApiError(502, `AI engine failed: ${msg}`);
  }
};
