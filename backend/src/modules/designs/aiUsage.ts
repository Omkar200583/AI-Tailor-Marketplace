import { AiUsageLog } from "../admin/aiUsageLog.model";

// Runs an AI call and records the outcome in ai_usage_logs
export const withUsageLog = async <T>(
  userId: string, feature: "design" | "tryon" | "recommendation", meta: { promptChars?: number; refId?: any }, fn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    await AiUsageLog.create({ userId, feature, status: "success", durationMs: Date.now() - start, ...meta });
    return result;
  } catch (err: any) {
    await AiUsageLog.create({ userId, feature, status: "failed", durationMs: Date.now() - start, error: err?.message, ...meta });
    throw err;
  }
};
