import { Router } from "express";
import { changePassword, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { passwordChangeSchema, profileSchema } from "../validators/schemas.js";

const router = Router();
router.use(protect);
router.put("/profile", validate(profileSchema), updateProfile);
router.put("/password", validate(passwordChangeSchema), changePassword);
export default router;
