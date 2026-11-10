import crypto from "crypto";

export const generateOtp = () => String(crypto.randomInt(100000, 1000000));
export const hashOtp = (otp: string) => crypto.createHash("sha256").update(otp).digest("hex");
export const otpExpiry = (minutes = 10) => new Date(Date.now() + minutes * 60 * 1000);

// Plug in an SMS/Email provider here (Twilio, MSG91, SES, ...).
export const sendOtp = async (target: string, otp: string) => {
  console.log(`[OTP] ${target}: ${otp}`);
};
