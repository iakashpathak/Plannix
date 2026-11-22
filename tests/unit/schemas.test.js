import { describe, expect, it } from "vitest";
import { loginSchema, passwordChangeSchema, projectUpdateSchema, registerSchema, taskCreateSchema, taskQuerySchema, taskUpdateSchema } from "../../server/validators/schemas.js";

const PID = "507f1f77bcf86cd799439011";
const ok = (schema, data) => schema.safeParse(data);
const msgs = (r) => r.error.issues.map((i) => i.message).join(" | ");

describe("registerSchema", () => {
  it("accepts valid data and normalises the email", () => {
    const r = ok(registerSchema, { name: "  Asha  ", email: "ASHA@Example.COM ", password: "Passw0rd123" });
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ name: "Asha", email: "asha@example.com" });
  });
  it("rejects invalid email", () => expect(ok(registerSchema, { name: "Asha", email: "nope", password: "Passw0rd123" }).success).toBe(false));
  it("rejects short password", () => expect(msgs(ok(registerSchema, { name: "Asha", email: "a@b.co", password: "a1" }))).toMatch(/at least 8/));
  it("rejects password without a number", () => expect(msgs(ok(registerSchema, { name: "Asha", email: "a@b.co", password: "onlyletters" }))).toMatch(/number/));
  it("rejects password without a letter", () => expect(msgs(ok(registerSchema, { name: "Asha", email: "a@b.co", password: "12345678" }))).toMatch(/letter/));
  it("rejects missing fields", () => expect(ok(registerSchema, {}).success).toBe(false));
});

describe("loginSchema", () => {
  it("requires email and password", () => {
    expect(ok(loginSchema, { email: "a@b.co" }).success).toBe(false);
    expect(ok(loginSchema, { email: "a@b.co", password: "x" }).success).toBe(true);
  });
});

describe("passwordChangeSchema", () => {
  it("rejects when new password equals current", () =>
    expect(ok(passwordChangeSchema, { currentPassword: "Passw0rd123", newPassword: "Passw0rd123" }).success).toBe(false));
});

describe("task schemas", () => {
  it("applies defaults on create", () => {
    const r = ok(taskCreateSchema, { title: "Do it", project: PID });
    expect(r.data).toMatchObject({ priority: "Medium", status: "Pending", description: "" });
  });
  it("rejects invalid priority, status and project id", () => {
    expect(ok(taskCreateSchema, { title: "x", project: PID, priority: "Urgent" }).success).toBe(false);
    expect(ok(taskCreateSchema, { title: "x", project: PID, status: "Done" }).success).toBe(false);
    expect(ok(taskCreateSchema, { title: "x", project: "123" }).success).toBe(false);
  });
  it("converts dueDate strings to Date, '' and null to null", () => {
    expect(ok(taskCreateSchema, { title: "x", project: PID, dueDate: "2030-01-15" }).data.dueDate).toBeInstanceOf(Date);
    expect(ok(taskUpdateSchema, { dueDate: "" }).data.dueDate).toBeNull();
    expect(ok(taskUpdateSchema, { dueDate: null }).data.dueDate).toBeNull();
    expect(ok(taskCreateSchema, { title: "x", project: PID, dueDate: "not-a-date" }).success).toBe(false);
  });
  it("update requires at least one field and does not inject defaults", () => {
    expect(ok(taskUpdateSchema, {}).success).toBe(false);
    expect(ok(projectUpdateSchema, {}).success).toBe(false);
    expect(ok(taskUpdateSchema, { title: "New" }).data).toEqual({ title: "New" });
  });
  it("query schema coerces page/limit and caps limit", () => {
    expect(ok(taskQuerySchema, { page: "2", limit: "10" }).data).toMatchObject({ page: 2, limit: 10, sort: "newest" });
    expect(ok(taskQuerySchema, { limit: "1000" }).success).toBe(false);
  });
});
