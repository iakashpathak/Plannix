import jwt from "jsonwebtoken";

export const COOKIE_NAME = "token";
const isProd = () => process.env.NODE_ENV === "production";

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set. Add it to your .env file or Vercel environment variables.");
  return s;
}

export const signToken = (userId) =>
  jwt.sign({ id: String(userId) }, secret(), { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

export const verifyToken = (token) => jwt.verify(token, secret());

// httpOnly  -> JavaScript in the browser cannot read the cookie (defends against XSS token theft)
// secure    -> only sent over HTTPS in production
// sameSite  -> "lax" blocks the cookie on cross-site POSTs (basic CSRF defence)
export const cookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export function sendAuthResponse(res, user, statusCode = 200) {
  res.cookie(COOKIE_NAME, signToken(user._id), cookieOptions());
  res.status(statusCode).json({ success: true, data: { user } });
}

export const clearAuthCookie = (res) => {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(COOKIE_NAME, opts);
};
