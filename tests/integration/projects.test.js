import { describe, expect, it } from "vitest";
import { app, createProject, createTask, loginAgent, Project, request, Task, useTestDb } from "../helpers.js";

useTestDb();

describe("auth required", () => {
  it.each([
    ["get", "/api/projects"],
    ["post", "/api/projects"],
    ["get", "/api/tasks"],
    ["post", "/api/tasks"],
    ["get", "/api/dashboard"],
  ])("%s %s returns 401 without login", async (method, url) => {
    expect((await request(app)[method](url).send({})).status).toBe(401);
  });
});

describe("Project CRUD", () => {
  it("creates a project owned by the logged-in user", async () => {
    const { agent, user } = await loginAgent();
    const res = await agent.post("/api/projects").send({ name: "  Website  ", description: "Build it", status: "Active" });
    expect(res.status).toBe(201);
    expect(res.body.data.project).toMatchObject({ name: "Website", description: "Build it", status: "Active", owner: user._id });
  });

  it("cannot choose another owner via the request body", async () => {
    const { agent, user } = await loginAgent();
    const res = await agent.post("/api/projects").send({ name: "X", owner: "507f1f77bcf86cd799439011" });
    expect(res.body.data.project.owner).toBe(user._id);
  });

  it("validates input (400)", async () => {
    const { agent } = await loginAgent();
    expect((await agent.post("/api/projects").send({})).status).toBe(400);
    expect((await agent.post("/api/projects").send({ name: "ok", status: "Done" })).status).toBe(400);
  });

  it("lists projects with task counts, newest first, with search + status filter", async () => {
    const { agent } = await loginAgent();
    const a = await createProject(agent, { name: "Alpha" });
    await createProject(agent, { name: "Beta", status: "On Hold" });
    await createTask(agent, a._id, { status: "Completed" });
    await createTask(agent, a._id, { status: "Pending" });

    const all = await agent.get("/api/projects");
    expect(all.body.data.projects.map((p) => p.name)).toEqual(["Beta", "Alpha"]);
    expect(all.body.data.projects[1].taskCounts).toEqual({ total: 2, pending: 1, inProgress: 0, completed: 1 });

    expect((await agent.get("/api/projects?q=alp")).body.data.projects).toHaveLength(1);
    expect((await agent.get("/api/projects?status=On%20Hold")).body.data.projects[0].name).toBe("Beta");
  });

  it("search treats regex characters literally (no regex injection)", async () => {
    const { agent } = await loginAgent();
    await createProject(agent, { name: "Alpha" });
    const res = await agent.get("/api/projects?q=.*");
    expect(res.status).toBe(200);
    expect(res.body.data.projects).toHaveLength(0);
  });

  it("gets, updates and deletes a project", async () => {
    const { agent } = await loginAgent();
    const p = await createProject(agent);
    expect((await agent.get(`/api/projects/${p._id}`)).body.data.project.name).toBe("Alpha");

    const upd = await agent.put(`/api/projects/${p._id}`).send({ name: "Renamed", status: "Completed" });
    expect(upd.status).toBe(200);
    expect(upd.body.data.project).toMatchObject({ name: "Renamed", status: "Completed" });

    expect((await agent.delete(`/api/projects/${p._id}`)).status).toBe(200);
    expect((await agent.get(`/api/projects/${p._id}`)).status).toBe(404);
  });

  it("deleting a project also deletes its tasks", async () => {
    const { agent } = await loginAgent();
    const p = await createProject(agent);
    const other = await createProject(agent, { name: "Keep me" });
    await createTask(agent, p._id);
    await createTask(agent, p._id, { title: "Second" });
    await createTask(agent, other._id);
    const res = await agent.delete(`/api/projects/${p._id}`);
    expect(res.body.data.deletedTasks).toBe(2);
    expect(await Task.countDocuments()).toBe(1);
    expect(await Project.countDocuments()).toBe(1);
  });

  it("returns 400 for a malformed id and 404 for a missing one", async () => {
    const { agent } = await loginAgent();
    expect((await agent.get("/api/projects/123")).status).toBe(400);
    expect((await agent.get("/api/projects/507f1f77bcf86cd799439011")).status).toBe(404);
  });
});
