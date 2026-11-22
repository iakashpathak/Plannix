import { Router } from "express";
import { listUsers, systemStats } from "../controllers/adminController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();
router.use(protect, authorize("admin")); // role-based authorization
router.get("/users", listUsers);
router.get("/stats", systemStats);
export default router;
