import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyToken } from "../utils/jwt";
import { Role } from "../types/express";
import { User } from "../modules/users/user.model";

export const protect = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.split(" ")[1] : req.cookies?.token;
    if (!token) throw ApiError.unauthorized("Authentication required");
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("role isActive");
    if (!user || !user.isActive) throw ApiError.unauthorized("Account not found or disabled");
    req.user = { id: user.id, role: user.role as Role };
    next();
  } catch (err) {
    next(err);
  }
};

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden("You do not have permission for this action"));
    next();
  };
