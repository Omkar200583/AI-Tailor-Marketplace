import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { env } from "../config/env";
import { verifyToken } from "../utils/jwt";
import { registerChatHandlers } from "./chat.socket";

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, { cors: { origin: env.CLIENT_URL, credentials: true } });

  io.use((socket, next) => {
    try {
      const cookie = socket.handshake.headers.cookie || "";
      const cookieToken = cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith("token="))?.split("=")[1];
      const token = (socket.handshake.auth?.token as string) || cookieToken;
      if (!token) return next(new Error("Authentication required"));
      const { id, role } = verifyToken(token);
      socket.data.userId = id;
      socket.data.role = role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    socket.join(`user:${socket.data.userId}`);
    registerChatHandlers(io!, socket);
  });

  return io;
};

export const getIO = () => io;
export const emitToUser = (userId: string, event: string, payload: unknown) => io?.to(`user:${userId}`).emit(event, payload);
