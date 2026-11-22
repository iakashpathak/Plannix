import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendAuthResponse } from "../utils/token.js";

// PUT /api/users/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  if (email && email !== req.user.email && (await User.exists({ email, _id: { $ne: req.user._id } }))) {
    throw new ApiError(409, "An account with this email already exists");
  }
  if (name !== undefined) req.user.name = name;
  if (email !== undefined) req.user.email = email;
  await req.user.save();
  res.json({ success: true, data: { user: req.user } });
});

// PUT /api/users/password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) throw new ApiError(400, "Current password is incorrect");
  user.password = newPassword; // hashed by the pre-save hook
  await user.save();
  sendAuthResponse(res, user); // issue a fresh token/cookie
});
