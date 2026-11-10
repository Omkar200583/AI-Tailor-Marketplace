import http from "http";
import mongoose from "mongoose";
import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { initSocket } from "./sockets";
import { startJobs } from "./jobs/orderExpiry.job";

const start = async () => {
  if (env.isProd && env.JWT_SECRET === "dev-secret-change-me") throw new Error("Set a strong JWT_SECRET in production");
  await connectDB();
  const server = http.createServer(app);
  initSocket(server);
  startJobs();
  server.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}/api/v1 (${env.NODE_ENV})`));

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => { await mongoose.connection.close(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

start().catch((err) => { console.error("Failed to start server", err); process.exit(1); });
