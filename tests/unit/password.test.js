import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import User from "../../server/models/User.js";

describe("password hashing (bcrypt)", () => {
  it("produces a hash that differs from the plain password", async () => {
    const hash = await bcrypt.hash("Passw0rd123", 4);
    expect(hash).not.toBe("Passw0rd123");
    expect(hash).toMatch(/^\$2[aby]\$04\$/); // bcrypt format with cost 4
  });

  it("generates a different hash each time (random salt)", async () => {
    const [a, b] = await Promise.all([bcrypt.hash("same", 4), bcrypt.hash("same", 4)]);
    expect(a).not.toBe(b);
  });

  it("verifies correct and incorrect passwords", async () => {
    const hash = await bcrypt.hash("Passw0rd123", 4);
    expect(await bcrypt.compare("Passw0rd123", hash)).toBe(true);
    expect(await bcrypt.compare("wrong", hash)).toBe(false);
  });

  it("User.comparePassword uses the stored hash", async () => {
    const user = new User({ name: "A B", email: "a@b.co", password: await bcrypt.hash("Secret123", 4) });
    expect(await user.comparePassword("Secret123")).toBe(true);
    expect(await user.comparePassword("nope")).toBe(false);
  });

  it("User JSON output never contains the password", () => {
    const user = new User({ name: "A B", email: "a@b.co", password: "hashed-value" });
    expect(user.toJSON().password).toBeUndefined();
  });
});
