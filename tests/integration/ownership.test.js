import { describe, expect, it } from "vitest";
import { createProject, createTask, loginAgent, Project, Task, useTestDb } from "../helpers.js";

useTestDb();

// The most important security tests: user B must never see or change user A's data.
describe("data ownership & authorization", () => {
  async function twoUsers() {
    const a = await loginAgent({ name: "User A" });
    const b = await loginAgent({ name: "User B" });
    const projectA = await createProject(a.agent, { name: "A's project" });
    const taskA = await createTask(a.agent, projectA._id, { title: "A's task" });
    return { a, b, projectA, taskA };
  }

  it("lists only the caller's own projects and tasks", async () => {
    const { b } = await twoUsers();
    expect((await b.agent.get("/api/projects")).body.data.projects).toHaveLength(0);
    expect((await b.agent.get("/api/tasks")).body.data.tasks).toHaveLength(0);
  });

  it("returns 404 (not 403) when reading someone else's project or task", async () => {
    const { b, projectA, taskA } = await twoUsers();
    expect((await b.agent.get(`/api/projects/${projectA._id}`)).status).toBe(404);
    expect((await b.agent.get(`/api/tasks/${taskA._id}`)).status).toBe(404);
  });

  it("cannot update someone else's project or task", async () => {
    const { b, projectA, taskA } = await twoUsers();
    expect((await b.agent.put(`/api/projects/${projectA._id}`).send({ name: "Hacked" })).status).toBe(404);
    expect((await b.agent.put(`/api/tasks/${taskA._id}`).send({ title: "Hacked" })).status).toBe(404);
    expect((await Project.findById(projectA._id)).name).toBe("A's project");
    expect((await Task.findById(taskA._id)).title).toBe("A's task");
  });

  it("cannot delete someone else's project or task", async () => {
    const { b, projectA, taskA } = await twoUsers();
    expect((await b.agent.delete(`/api/projects/${projectA._id}`)).status).toBe(404);
    expect((await b.agent.delete(`/api/tasks/${taskA._id}`)).status).toBe(404);
    expect(await Project.countDocuments()).toBe(1);
    expect(await Task.countDocuments()).toBe(1);
  });

  it("cannot create a task inside someone else's project", async () => {
    const { b, projectA } = await twoUsers();
    const res = await b.agent.post("/api/tasks").send({ title: "Sneaky", project: projectA._id });
    expect(res.status).toBe(400);
    expect(await Task.countDocuments({ title: "Sneaky" })).toBe(0);
  });

  it("cannot move your own task into someone else's project", async () => {
    const { b, projectA } = await twoUsers();
    const mine = await createProject(b.agent, { name: "mine" });
    const task = await createTask(b.agent, mine._id);
    const res = await b.agent.put(`/api/tasks/${task._id}`).send({ project: projectA._id });
    expect(res.status).toBe(400);
  });

  it("dashboard statistics only count the caller's data", async () => {
    const { a, b } = await twoUsers();
    expect((await a.agent.get("/api/dashboard")).body.data.stats).toMatchObject({ totalProjects: 1, totalTasks: 1 });
    expect((await b.agent.get("/api/dashboard")).body.data.stats).toMatchObject({ totalProjects: 0, totalTasks: 0 });
  });

  it("regular users get 403 on admin routes", async () => {
    const { a } = await twoUsers();
    expect((await a.agent.get("/api/admin/users")).status).toBe(403);
    expect((await a.agent.get("/api/admin/stats")).status).toBe(403);
  });
});
