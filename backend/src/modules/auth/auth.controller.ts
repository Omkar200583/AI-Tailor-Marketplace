import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { cookieOptions, signToken } from "../../utils/jwt";
import { generateOtp, hashOtp, otpExpiry, sendOtp } from "../../utils/otp";
import { env } from "../../config/env";
import { User } from "../users/user.model";

const issueOtp = async (userId: string, target: string, purpose: "verify" | "reset") => {
  const otp = generateOtp();
  await User.findByIdAndUpdate(userId, { otpHash: hashOtp(otp), otpExpires: otpExpiry(10), otpPurpose: purpose });
  await sendOtp(target, otp);
  return otp;
};

const checkOtp = async (email: string, otp: string, purpose: "verify" | "reset") => {
  const user = await User.findOne({ email }).select("+otpHash +otpExpires +otpPurpose +passwordHash");
  if (!user || !user.otpHash || !user.otpExpires || user.otpPurpose !== purpose) throw ApiError.badRequest("Invalid or expired OTP");
  if (user.otpExpires.getTime() < Date.now() || user.otpHash !== hashOtp(otp)) throw ApiError.badRequest("Invalid or expired OTP");
  return user;
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password, role } = req.body;
  const exists = await User.findOne({ $or: [{ email }, ...(phone ? [{ phone }] : [])] });
  if (exists) throw ApiError.conflict("Email or phone already registered");
  const user = await User.create({ name, email, phone, role, passwordHash: await bcrypt.hash(password, 12) });
  const otp = await issueOtp(user.id, email, "verify");
  created(res, { id: user.id, email: user.email, ...(env.isProd ? {} : { devOtp: otp }) }, "Registered. Please verify the OTP sent to you.");
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const user = await checkOtp(req.body.email, req.body.otp, "verify");
  user.isVerified = true;
  user.otpHash = undefined;
  user.otpExpires = undefined;
  user.otpPurpose = undefined;
  await user.save();
  const token = signToken(user.id, user.role as any);
  res.cookie("token", token, cookieOptions);
  ok(res, { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, "Account verified");
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email });
  if (user && !user.isVerified) await issueOtp(user.id, user.email, "verify");
  ok(res, null, "If the account exists, an OTP has been sent");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const user = await User.findOne({ $or: [{ email: identifier.toLowerCase() }, { phone: identifier }] }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw ApiError.unauthorized("Invalid credentials");
  if (!user.isActive) throw ApiError.forbidden("Account is disabled");
  if (!user.isVerified) throw ApiError.forbidden("Please verify your account with the OTP first");
  user.lastLoginAt = new Date();
  await user.save();
  const token = signToken(user.id, user.role as any);
  res.cookie("token", token, cookieOptions);
  ok(res, { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, profileImage: user.profileImage } }, "Logged in");
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  ok(res, null, "Logged out");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email });
  let devOtp: string | undefined;
  if (user) devOtp = await issueOtp(user.id, user.email, "reset");
  ok(res, env.isProd ? null : { devOtp }, "If the account exists, an OTP has been sent");
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await checkOtp(req.body.email, req.body.otp, "reset");
  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  user.otpHash = undefined;
  user.otpExpires = undefined;
  user.otpPurpose = undefined;
  await user.save();
  ok(res, null, "Password reset successful");
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id).select("+passwordHash");
  if (!user || !(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) throw ApiError.badRequest("Current password is incorrect");
  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await user.save();
  ok(res, null, "Password changed");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await User.findById(req.user!.id));
});
