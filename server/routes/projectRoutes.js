import { Router } from "express";
import { createProject, deleteProject, getProject, listProjects, updateProject } from "../controllers/projectController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema, projectCreateSchema, projectQuerySchema, projectUpdateSchema } from "../validators/schemas.js";

const router = Router();
router.use(protect); // every project route requires a logged-in user

router.route("/").get(validate(projectQuerySchema, "query"), listProjects).post(validate(projectCreateSchema), createProject);
router
  .route("/:id")
  .all(validate(idParamSchema, "params"))
  .get(getProject)
  .put(validate(projectUpdateSchema), updateProject)
  .delete(deleteProject);

export default router;
