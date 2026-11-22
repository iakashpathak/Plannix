import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it } from "vitest";
import { cookieOptions, signToken, verifyToken } from "../../server/utils/token.js";

describe("JWT helpers", () => {
  it("signs and verifies a token containing the user id", () => {
    const token = signToken("507f1f77bcf86cd799439011");
    expect(verifyToken(token).id).toBe("507f1f77bcf86cd799439011");
  });

  it("rejects a tampered token", () => {
    const [h, p, s] = signToken("abc").split(".");
    const tampered = `${h}.${Buffer.from(JSON.stringify({ id: "hacker" })).toString("base64url")}.${s}`;
    expect(() => verifyToken(tampered)).toThrow();
    expect(p).toBeTruthy();
  });

  it("rejects a token signed with another secret", () => {
    const forged = jwt.sign({ id: "abc" }, "different-secret");
    expect(() => verifyToken(forged)).toThrow(/invalid signature/);
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign({ id: "abc" }, process.env.JWT_SECRET, { expiresIn: -10 });
    expect(() => verifyToken(expired)).toThrow(/expired/);
  });
});

describe("cookie options", () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it("is httpOnly + lax in every environment", () => {
    expect(cookieOptions()).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });
  it("is NOT secure outside production (so http://localhost works)", () => {
    expect(cookieOptions().secure).toBe(false);
  });
  it("is secure in production (HTTPS only)", () => {
    process.env.NODE_ENV = "production";
    expect(cookieOptions().secure).toBe(true);
  });
});
