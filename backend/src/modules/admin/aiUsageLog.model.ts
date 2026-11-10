import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const aiUsageLogSchema = new Schema(
  {
    userId: { ...oid("User", true), index: true },
    feature: { type: String, enum: ["design", "tryon", "recommendation"], required: true, index: true },
    status: { type: String, enum: ["success", "failed"], required: true },
    durationMs: Number,
    promptChars: Number,
    refId: Schema.Types.ObjectId,
    error: String,
  },
  { timestamps: true }
);

export const AiUsageLog = model("AiUsageLog", aiUsageLogSchema, "ai_usage_logs");
