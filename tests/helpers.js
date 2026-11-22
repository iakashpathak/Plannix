import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach } from "vitest";
import app from "../server/app.js";
import { connectDB, disconnectDB } from "../server/config/db.js";
import Activity from "../server/models/Activity.js";
import Project from "../server/models/Project.js";
import Task from "../server/models/Task.js";
import User from "../server/models/User.js";

export { app, request, User, Project, Task, Activity };

// Connect once per file, wipe data before each test, disconnect at the end.
export function useTestDb() {
  beforeAll(async () => {
    try {
      await connectDB();
    } catch (err) {
      throw new Error(`Cannot reach the test database (${process.env.MONGODB_URI}). Start MongoDB or set MONGODB_URI_TEST. ${err.message}`);
    }
    await Promise.all([User.init(), Project.init(), Task.init(), Activity.init()]); // build indexes (unique email)
  });
  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({}), Activity.deleteMany({})]);
  });
  afterAll(async () => {
    await disconnectDB();
  });
}

let counter = 0;
export const newUserData = (overrides = {}) => ({
  name: "Test User",
  email: `user${++counter}@example.com`,
  password: "Passw0rd123",
  ...overrides,
});

// Returns a supertest *agent* that keeps cookies, exactly like a browser would.
export async function loginAgent(overrides = {}) {
  const agent = request.agent(app);
  const data = newUserData(overrides);
  const res = await agent.post("/api/auth/register").send(data);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, user: res.body.data.user, credentials: data };
}

export const createProject = async (agent, body = {}) =>
  (await agent.post("/api/projects").send({ name: "Alpha", ...body })).body.data.project;

export const createTask = async (agent, project, body = {}) =>
  (await agent.post("/api/tasks").send({ title: "Write tests", project, ...body })).body.data.task;

export const isConnected = () => mongoose.connection.readyState === 1;
