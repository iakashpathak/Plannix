import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { COOKIE_NAME, verifyToken } from "../utils/token.js";

// AUTHENTICATION: "who are you?"  Reads the JWT from the HTTP-only cookie (or an Authorization: Bearer header,
// handy for Postman), verifies the signature/expiry, and loads the user into req.user.
export const protect = asyncHandler(async (req, _res, next) => {
  let token = req.cookies?.[COOKIE_NAME];
  const header = req.headers.authorization;
  if (!token && header?.startsWith("Bearer ")) token = header.slice(7);
  if (!token) throw new ApiError(401, "Not authenticated. Please log in.");

  const decoded = verifyToken(token); // throws JsonWebTokenError / TokenExpiredError -> 401 in errorHandler
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, "The account for this session no longer exists.");
  req.user = user;
  next();
});

// AUTHORIZATION: "are you allowed to do this?"  e.g. router.use(protect, authorize("admin"))
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to perform this action."));
  }
  next();
};
