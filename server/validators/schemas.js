import { z } from "zod";
import { PROJECT_STATUSES } from "../models/Project.js";
import { TASK_PRIORITIES, TASK_STATUSES } from "../models/Task.js";

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const email = z.string({ required_error: "Email is required" }).trim().toLowerCase().email("Please provide a valid email");

const password = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

const name = z.string({ required_error: "Name is required" }).trim().min(2, "Name must be at least 2 characters").max(50);

// "" or null clears the date; undefined means "not provided".
const dateField = z
  .string()
  .nullable()
  .optional()
  .transform((v, ctx) => {
    if (v === undefined) return undefined;
    if (v === null || v === "") return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Invalid date" });
      return z.NEVER;
    }
    return d;
  });

const atLeastOne = (obj) => Object.keys(obj).length > 0;
const atLeastOneMsg = { message: "Provide at least one field to update" };

export const registerSchema = z.object({ name, email, password });
export const loginSchema = z.object({ email, password: z.string({ required_error: "Password is required" }).min(1, "Password is required") });

export const profileSchema = z.object({ name, email }).partial().refine(atLeastOne, atLeastOneMsg);
export const passwordChangeSchema = z
  .object({ currentPassword: z.string().min(1, "Current password is required"), newPassword: password })
  .refine((d) => d.currentPassword !== d.newPassword, { message: "New password must be different", path: ["newPassword"] });

const projectBase = z.object({
  name: z.string({ required_error: "Project name is required" }).trim().min(1, "Project name is required").max(100),
  description: z.string().trim().max(500).default(""),
  status: z.enum(PROJECT_STATUSES).default("Active"),
});
export const projectCreateSchema = projectBase;
export const projectUpdateSchema = projectBase.partial().refine(atLeastOne, atLeastOneMsg);

const taskBase = z.object({
  title: z.string({ required_error: "Task title is required" }).trim().min(1, "Task title is required").max(120),
  description: z.string().trim().max(1000).default(""),
  project: objectId,
  priority: z.enum(TASK_PRIORITIES).default("Medium"),
  status: z.enum(TASK_STATUSES).default("Pending"),
  dueDate: dateField,
});
export const taskCreateSchema = taskBase;
export const taskUpdateSchema = taskBase.partial().refine(atLeastOne, atLeastOneMsg);

export const taskQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  project: objectId.optional(),
  sort: z.enum(["newest", "oldest", "due", "priority"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const projectQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
});

export const idParamSchema = z.object({ id: objectId });
