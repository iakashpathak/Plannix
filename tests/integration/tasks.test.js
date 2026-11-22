import { describe, expect, it } from "vitest";
import { createProject, createTask, loginAgent, Task, useTestDb } from "../helpers.js";

useTestDb();

async function setup() {
  const { agent, user } = await loginAgent();
  const project = await createProject(agent);
  return { agent, user, project };
}

describe("Task CRUD", () => {
  it("creates a task with defaults", async () => {
    const { agent, project, user } = await setup();
    const res = await agent.post("/api/tasks").send({ title: "  Write report ", project: project._id });
    expect(res.status).toBe(201);
    expect(res.body.data.task).toMatchObject({ title: "Write report", priority: "Medium", status: "Pending", owner: user._id, dueDate: null });
    expect(res.body.data.task.project).toMatchObject({ _id: project._id, name: "Alpha" }); // populated
  });

  it("stores priority, status and due date", async () => {
    const { agent, project } = await setup();
    const res = await agent.post("/api/tasks").send({ title: "T", project: project._id, priority: "High", status: "In Progress", dueDate: "2030-05-20" });
    expect(res.body.data.task).toMatchObject({ priority: "High", status: "In Progress" });
    expect(res.body.data.task.dueDate).toMatch(/^2030-05-20/);
  });

  it.each([
    [{ title: "" }, "empty title"],
    [{ priority: "Urgent" }, "bad priority"],
    [{ status: "Done" }, "bad status"],
    [{ dueDate: "tomorrow-ish" }, "bad date"],
    [{ project: "abc" }, "bad project id"],
  ])("rejects invalid input %j (%s)", async (override) => {
    const { agent, project } = await setup();
    const res = await agent.post("/api/tasks").send({ title: "ok", project: project._id, ...override });
    expect(res.status).toBe(400);
  });

  it("requires an existing project", async () => {
    const { agent } = await setup();
    const res = await agent.post("/api/tasks").send({ title: "Orphan", project: "507f1f77bcf86cd799439011" });
    expect(res.status).toBe(400);
  });

  it("updates a task, sets/clears completedAt, and can clear the due date", async () => {
    const { agent, project } = await setup();
    const t = await createTask(agent, project._id, { dueDate: "2030-01-01" });

    const done = await agent.put(`/api/tasks/${t._id}`).send({ status: "Completed" });
    expect(done.status).toBe(200);
    expect(done.body.data.task.status).toBe("Completed");
    expect(done.body.data.task.completedAt).toBeTruthy();

    const reopened = await agent.put(`/api/tasks/${t._id}`).send({ status: "Pending", dueDate: null });
    expect(reopened.body.data.task.completedAt).toBeNull();
    expect(reopened.body.data.task.dueDate).toBeNull();
  });

  it("rejects an empty update body", async () => {
    const { agent, project } = await setup();
    const t = await createTask(agent, project._id);
    expect((await agent.put(`/api/tasks/${t._id}`).send({})).status).toBe(400);
  });

  it("gets one task and deletes it", async () => {
    const { agent, project } = await setup();
    const t = await createTask(agent, project._id);
    expect((await agent.get(`/api/tasks/${t._id}`)).body.data.task.title).toBe("Write tests");
    expect((await agent.delete(`/api/tasks/${t._id}`)).status).toBe(200);
    expect(await Task.countDocuments()).toBe(0);
    expect((await agent.delete(`/api/tasks/${t._id}`)).status).toBe(404);
  });
});

describe("Task search, filter, sort, pagination", () => {
  async function seed() {
    const { agent } = await loginAgent();
    const p1 = await createProject(agent, { name: "P1" });
    const p2 = await createProject(agent, { name: "P2" });
    await createTask(agent, p1._id, { title: "Alpha report", priority: "Low", status: "Pending", dueDate: "2030-03-01" });
    await createTask(agent, p1._id, { title: "Beta code", priority: "High", status: "In Progress", dueDate: "2030-01-01" });
    await createTask(agent, p2._id, { title: "Gamma slides", description: "alpha deck", priority: "Medium", status: "Completed", dueDate: "2030-02-01" });
    return { agent, p1, p2 };
  }

  it("filters by status, priority and project", async () => {
    const { agent, p2 } = await seed();
    expect((await agent.get("/api/tasks?status=Pending")).body.data.tasks).toHaveLength(1);
    expect((await agent.get("/api/tasks?priority=High")).body.data.tasks[0].title).toBe("Beta code");
    expect((await agent.get(`/api/tasks?project=${p2._id}`)).body.data.tasks[0].title).toBe("Gamma slides");
  });

  it("searches title and description, case-insensitively", async () => {
    const { agent } = await seed();
    const titles = (await agent.get("/api/tasks?q=ALPHA")).body.data.tasks.map((t) => t.title).sort();
    expect(titles).toEqual(["Alpha report", "Gamma slides"]);
  });

  it("combines filters", async () => {
    const { agent } = await seed();
    const res = await agent.get("/api/tasks?q=alpha&status=Completed");
    expect(res.body.data.tasks.map((t) => t.title)).toEqual(["Gamma slides"]);
  });

  it("sorts by due date and by priority (High first)", async () => {
    const { agent } = await seed();
    expect((await agent.get("/api/tasks?sort=due")).body.data.tasks.map((t) => t.title)).toEqual(["Beta code", "Gamma slides", "Alpha report"]);
    expect((await agent.get("/api/tasks?sort=priority")).body.data.tasks.map((t) => t.priority)).toEqual(["High", "Medium", "Low"]);
  });

  it("paginates", async () => {
    const { agent } = await seed();
    const res = await agent.get("/api/tasks?limit=2&page=2");
    expect(res.body.data.tasks).toHaveLength(1);
    expect(res.body.data.pagination).toMatchObject({ page: 2, limit: 2, total: 3, pages: 2 });
  });

  it("rejects invalid query params with 400", async () => {
    const { agent } = await seed();
    expect((await agent.get("/api/tasks?status=Nope")).status).toBe(400);
    expect((await agent.get("/api/tasks?limit=5000")).status).toBe(400);
  });
});
