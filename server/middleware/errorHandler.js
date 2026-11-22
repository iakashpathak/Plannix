import { ZodError } from "zod";
import ApiError from "../utils/ApiError.js";

export const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// Centralized error handling: every thrown/forwarded error ends up here and becomes a consistent JSON body:
// { success: false, message: "...", errors?: [{ field, message }] }
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || "Server error";
  let errors = err.errors;

  if (err instanceof ZodError) {
    status = 400;
    message = "Validation failed";
    errors = err.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
  } else if (err.name === "ValidationError" && err.errors) {
    status = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    message = `A record with this ${field} already exists`;
  } else if (err.name === "TokenExpiredError") {
    status = 401;
    message = "Session expired. Please log in again.";
  } else if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "Invalid session. Please log in again.";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON in request body";
  } else if (err.name === "MongooseServerSelectionError" || err.code === "NO_MONGODB_URI") {
    status = 503;
    message = err.code === "NO_MONGODB_URI" ? err.message : "Database is unavailable. Check MONGODB_URI and Atlas Network Access.";
  }

  if (status >= 500 && process.env.NODE_ENV !== "test") console.error(`[${status}]`, err);

  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (process.env.NODE_ENV === "development" && status >= 500) body.stack = err.stack;
  res.status(status).json(body);
}
