export type Role = "user" | "seller" | "designer" | "admin";
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
      rawBody?: Buffer;
    }
  }
}
export {};
