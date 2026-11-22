import { describe, expect, it, vi } from "vitest";
import { authorize, protect } from "../../server/middleware/auth.js";
import { errorHandler } from "../../server/middleware/errorHandler.js";
import ApiError from "../../server/utils/ApiError.js";

const mockRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

describe("protect middleware", () => {
  it("rejects requests without a token (401) before touching the database", async () => {
    const next = vi.fn();
    await protect({ cookies: {}, headers: {} }, mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
  });

  it("rejects a malformed token (401)", async () => {
    const next = vi.fn();
    await protect({ cookies: { token: "garbage" }, headers: {} }, mockRes(), next);
    expect(next.mock.calls[0][0].name).toBe("JsonWebTokenError");
  });
});

describe("authorize middleware", () => {
  it("allows a matching role", () => {
    const next = vi.fn();
    authorize("admin")({ user: { role: "admin" } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });
  it("blocks other roles with 403", () => {
    const next = vi.fn();
    authorize("admin")({ user: { role: "user" } }, mockRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });
});

describe("errorHandler", () => {
  const run = (err) => {
    const res = mockRes();
    errorHandler(err, {}, res, vi.fn());
    return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
  };
  it("maps ApiError to its status", () => expect(run(new ApiError(404, "nope"))).toMatchObject({ status: 404, body: { success: false, message: "nope" } }));
  it("maps duplicate key errors to 409", () => expect(run(Object.assign(new Error("dup"), { code: 11000, keyPattern: { email: 1 } })).status).toBe(409));
  it("maps CastError to 400", () => expect(run(Object.assign(new Error("x"), { name: "CastError", path: "_id" })).status).toBe(400));
  it("maps malformed JSON to 400", () => expect(run(Object.assign(new Error("x"), { type: "entity.parse.failed" })).status).toBe(400));
  it("maps unknown errors to 500 without leaking internals", () => {
    const { status, body } = run(new Error("secret internals"));
    expect(status).toBe(500);
    expect(body.stack).toBeUndefined();
  });
});
