import bcrypt from "bcryptjs";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { clearAuthCookie, sendAuthResponse } from "../utils/token.js";

// A valid-looking hash used to keep login timing similar whether or not the email exists.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.Uqp1m5S9v1xq3q1m9mQ3Yy8mQ6aa";

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body; // already validated + normalised by Zod
  if (await User.exists({ email })) throw new ApiError(409, "An account with this email already exists");
  const user = await User.create({ name, email, password }); // pre-save hook hashes the password
  sendAuthResponse(res, user, 201);
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password"); // password is select:false by default
  const ok = user ? await user.comparePassword(password) : await bcrypt.compare(password, DUMMY_HASH).then(() => false);
  if (!ok) throw new ApiError(401, "Invalid email or password"); // same message for both cases on purpose
  sendAuthResponse(res, user);
});

// POST /api/auth/logout
export const logout = (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, data: { message: "Logged out" } });
};

// GET /api/auth/me  (protected) - lets the React app restore the session on page refresh
export const me = (req, res) => res.json({ success: true, data: { user: req.user } });
