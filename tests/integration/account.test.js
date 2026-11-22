import { describe, expect, it } from "vitest";
import { app, createProject, createTask, loginAgent, request, useTestDb, User } from "../helpers.js";

useTestDb();

describe("dashboard", () => {
  it("returns zeros for a brand-new user", async () => {
    const { agent } = await loginAgent();
    const res = await agent.get("/api/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.data.stats).toEqual({ totalProjects: 0, totalTasks: 0, completedTasks: 0, pendingTasks: 0, inProgressTasks: 0, overdueTasks: 0, completionRate: 0 });
    expect(res.body.data.recentActivities).toEqual([]);
  });

  it("computes totals, completion rate, overdue and activity feed", async () => {
    const { agent } = await loginAgent();
    const p = await createProject(agent);
    await createTask(agent, p._id, { title: "done", status: "Completed" });
    await createTask(agent, p._id, { title: "wip", status: "In Progress" });
    await createTask(agent, p._id, { title: "late", status: "Pending", dueDate: "2000-01-01" });
    const t4 = await createTask(agent, p._id, { title: "four" });
    await agent.put(`/api/tasks/${t4._id}`).send({ status: "Completed" });

    const { stats, recentActivities, upcomingTasks } = (await agent.get("/api/dashboard")).body.data;
    expect(stats).toMatchObject({ totalProjects: 1, totalTasks: 4, completedTasks: 2, pendingTasks: 1, inProgressTasks: 1, overdueTasks: 1, completionRate: 50 });
    expect(recentActivities[0]).toMatchObject({ action: "completed", entityType: "task", entityName: "four" });
    expect(recentActivities.length).toBeGreaterThan(3);
    expect(upcomingTasks[0].title).toBe("late");
  });
});

describe("profile", () => {
  it("updates name and email", async () => {
    const { agent } = await loginAgent();
    const res = await agent.put("/api/users/profile").send({ name: "New Name", email: "NEW@example.com" });
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ name: "New Name", email: "new@example.com" });
  });

  it("rejects an email that belongs to another user (409)", async () => {
    const other = await loginAgent({ email: "taken@example.com" });
    const { agent } = await loginAgent();
    expect(other.user.email).toBe("taken@example.com");
    expect((await agent.put("/api/users/profile").send({ email: "taken@example.com" })).status).toBe(409);
  });

  it("validates input and requires login", async () => {
    const { agent } = await loginAgent();
    expect((await agent.put("/api/users/profile").send({ email: "bad" })).status).toBe(400);
    expect((await agent.put("/api/users/profile").send({})).status).toBe(400);
    expect((await request(app).put("/api/users/profile").send({ name: "x y" })).status).toBe(401);
  });
});

describe("change password", () => {
  it("changes the password: old one stops working, new one works, stored as a hash", async () => {
    const { agent, credentials } = await loginAgent();
    const res = await agent.put("/api/users/password").send({ currentPassword: credentials.password, newPassword: "BrandNew456" });
    expect(res.status).toBe(200);

    const stored = await User.findOne({ email: credentials.email }).select("+password");
    expect(stored.password).not.toBe("BrandNew456");

    expect((await request(app).post("/api/auth/login").send({ email: credentials.email, password: credentials.password })).status).toBe(401);
    expect((await request(app).post("/api/auth/login").send({ email: credentials.email, password: "BrandNew456" })).status).toBe(200);
  });

  it("rejects a wrong current password (400) and weak new passwords", async () => {
    const { agent, credentials } = await loginAgent();
    expect((await agent.put("/api/users/password").send({ currentPassword: "Wrong1234", newPassword: "BrandNew456" })).status).toBe(400);
    expect((await agent.put("/api/users/password").send({ currentPassword: credentials.password, newPassword: "weak" })).status).toBe(400);
    expect((await agent.put("/api/users/password").send({ currentPassword: credentials.password, newPassword: credentials.password })).status).toBe(400);
  });
});

describe("admin role", () => {
  it("lets an admin list users (without password hashes) and see system stats", async () => {
    const { agent, user } = await loginAgent();
    await loginAgent(); // a second user
    await User.findByIdAndUpdate(user._id, { role: "admin" });

    const users = await agent.get("/api/admin/users");
    expect(users.status).toBe(200);
    expect(users.body.data.users).toHaveLength(2);
    expect(JSON.stringify(users.body)).not.toMatch(/\$2[aby]\$/);

    const stats = await agent.get("/api/admin/stats");
    expect(stats.body.data).toMatchObject({ users: 2, projects: 0, tasks: 0 });
  });
});
