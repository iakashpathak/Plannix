import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { app, loginAgent, newUserData, request, useTestDb, User } from "../helpers.js";

useTestDb();

const cookieOf = (res) => (res.headers["set-cookie"] || []).find((c) => c.startsWith("token="));

describe("health", () => {
  it("GET /api/health responds ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
  });
  it("GET /api/health/db confirms the database connection", async () => {
    const res = await request(app).get("/api/health/db");
    expect(res.status).toBe(200);
    expect(res.body.data.database).toBe("connected");
  });
});

describe("POST /api/auth/register", () => {
  it("creates a user, hashes the password, and sets an HTTP-only cookie", async () => {
    const data = newUserData({ email: "Asha@Example.com" });
    const res = await request(app).post("/api/auth/register").send(data);
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ name: "Test User", email: "asha@example.com", role: "user" });
    expect(res.body.data.user.password).toBeUndefined();

    const cookie = cookieOf(res);
    expect(cookie).toBeTruthy();
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const stored = await User.findOne({ email: "asha@example.com" }).select("+password");
    expect(stored.password).not.toBe(data.password); // NOT plain text
    expect(stored.password).toMatch(/^\$2[aby]\$/); // bcrypt hash
    expect(await bcrypt.compare(data.password, stored.password)).toBe(true);
  });

  it("rejects duplicate emails (409), case-insensitively", async () => {
    await request(app).post("/api/auth/register").send(newUserData({ email: "dup@example.com" }));
    const res = await request(app).post("/api/auth/register").send(newUserData({ email: "DUP@example.com" }));
    expect(res.status).toBe(409);
  });

  it.each([
    [{ name: "A" }, "short name"],
    [{ email: "bad" }, "bad email"],
    [{ password: "short1" }, "short password"],
    [{ password: "alllettersss" }, "password without number"],
  ])("returns 400 with field errors for invalid input (%j – %s)", async (override) => {
    const res = await request(app).post("/api/auth/register").send(newUserData(override));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it("ignores attempts to self-assign the admin role (mass assignment)", async () => {
    const res = await request(app).post("/api/auth/register").send({ ...newUserData(), role: "admin" });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("user");
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await request(app).post("/api/auth/register").set("Content-Type", "application/json").send("{bad json");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials and sets a cookie", async () => {
    const { credentials } = await loginAgent();
    const res = await request(app).post("/api/auth/login").send({ email: credentials.email, password: credentials.password });
    expect(res.status).toBe(200);
    expect(cookieOf(res)).toMatch(/HttpOnly/i);
    expect(res.body.data.user.email).toBe(credentials.email);
  });

  it("rejects a wrong password with 401 and a generic message", async () => {
    const { credentials } = await loginAgent();
    const res = await request(app).post("/api/auth/login").send({ email: credentials.email, password: "WrongPass1" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
    expect(cookieOf(res)).toBeUndefined();
  });

  it("gives the SAME message for an unknown email (no user enumeration)", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "ghost@example.com", password: "Whatever1" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("returns 400 when fields are missing", async () => {
    expect((await request(app).post("/api/auth/login").send({})).status).toBe(400);
  });
});

describe("session: /me and logout", () => {
  it("GET /api/auth/me returns the user when the cookie is present", async () => {
    const { agent, user } = await loginAgent();
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.data.user._id).toBe(user._id);
  });

  it("GET /api/auth/me returns 401 without a cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a forged / invalid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Cookie", "token=not.a.realtoken");
    expect(res.status).toBe(401);
  });

  it("accepts an Authorization: Bearer token (Postman style)", async () => {
    const { credentials } = await loginAgent();
    const login = await request(app).post("/api/auth/login").send({ email: credentials.email, password: credentials.password });
    const token = cookieOf(login).split(";")[0].replace("token=", "");
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("logout clears the cookie and the session stops working", async () => {
    const { agent } = await loginAgent();
    const out = await agent.post("/api/auth/logout");
    expect(out.status).toBe(200);
    expect(cookieOf(out)).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });

  it("returns 401 if the user was deleted after the token was issued", async () => {
    const { agent, user } = await loginAgent();
    await User.findByIdAndDelete(user._id);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });
});

describe("unknown routes", () => {
  it("returns a JSON 404", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
