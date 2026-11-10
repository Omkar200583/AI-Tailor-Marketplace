import { Response } from "express";

export const ok = (res: Response, data: unknown = null, message = "Success", status = 200, meta?: unknown) =>
  res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });

export const created = (res: Response, data: unknown = null, message = "Created") => ok(res, data, message, 201);
