import { Router } from "express";
import { createTask, deleteTask, getTask, listTasks, updateTask } from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema, taskCreateSchema, taskQuerySchema, taskUpdateSchema } from "../validators/schemas.js";

const router = Router();
router.use(protect);

router.route("/").get(validate(taskQuerySchema, "query"), listTasks).post(validate(taskCreateSchema), createTask);
router
  .route("/:id")
  .all(validate(idParamSchema, "params"))
  .get(getTask)
  .put(validate(taskUpdateSchema), updateTask)
  .delete(deleteTask);

export default router;
