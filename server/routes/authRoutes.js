import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, me, register } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/schemas.js";

const router = Router();

// Brute-force protection. NOTE: the default in-memory store is per serverless instance (best-effort on Vercel).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { success: false, message: "Too many attempts. Please try again in a few minutes." },
});

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", protect, me);

export default router;
