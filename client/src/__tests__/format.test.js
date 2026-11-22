import { describe, expect, it } from "vitest";
import { formatDate, getErrorMessage, getFieldErrors, greeting, isOverdue, timeAgo, toDateInput } from "../utils/format";

describe("getErrorMessage", () => {
  it("prefers the API message", () => expect(getErrorMessage({ response: { data: { message: "Invalid email or password" } } })).toBe("Invalid email or password"));
  it("explains network failures", () => expect(getErrorMessage({ request: {}, message: "Network Error" })).toMatch(/Cannot reach the server/));
  it("explains timeouts", () => expect(getErrorMessage({ code: "ECONNABORTED" })).toMatch(/timed out/));
  it("falls back for unknown errors", () => expect(getErrorMessage({})).toMatch(/Something went wrong/));
});

describe("getFieldErrors", () => {
  it("maps API validation errors to a field->message object (first error wins)", () => {
    const err = { response: { data: { errors: [{ field: "email", message: "bad" }, { field: "email", message: "second" }, { field: "password", message: "short" }] } } };
    expect(getFieldErrors(err)).toEqual({ email: "bad", password: "short" });
  });
  it("returns {} when there are none", () => expect(getFieldErrors({})).toEqual({}));
});

describe("dates", () => {
  it("formats a due date, with a placeholder when missing", () => {
    expect(formatDate("2030-05-20T00:00:00.000Z")).toMatch(/2030/);
    expect(formatDate(null)).toBe("No due date");
  });
  it("converts to the yyyy-mm-dd format used by <input type=date>", () => {
    expect(toDateInput("2030-05-20T00:00:00.000Z")).toBe("2030-05-20");
    expect(toDateInput(null)).toBe("");
  });
  it("detects overdue tasks (completed and undated tasks are never overdue)", () => {
    const now = new Date("2030-06-10T12:00:00Z");
    expect(isOverdue({ dueDate: "2030-06-01T00:00:00Z", status: "Pending" }, now)).toBe(true);
    expect(isOverdue({ dueDate: "2030-06-01T00:00:00Z", status: "Completed" }, now)).toBe(false);
    expect(isOverdue({ dueDate: "2030-06-20T00:00:00Z", status: "Pending" }, now)).toBe(false);
    expect(isOverdue({ dueDate: null, status: "Pending" }, now)).toBe(false);
  });
  it("formats relative time", () => {
    const now = Date.parse("2030-01-01T12:00:00Z");
    expect(timeAgo("2030-01-01T11:59:50Z", now)).toBe("just now");
    expect(timeAgo("2030-01-01T11:30:00Z", now)).toBe("30 minutes ago");
    expect(timeAgo("2030-01-01T10:00:00Z", now)).toBe("2 hours ago");
    expect(timeAgo("2029-12-30T12:00:00Z", now)).toBe("2 days ago");
  });
  it("greets by time of day", () => {
    expect(greeting(8)).toBe("Good morning");
    expect(greeting(14)).toBe("Good afternoon");
    expect(greeting(21)).toBe("Good evening");
  });
});
