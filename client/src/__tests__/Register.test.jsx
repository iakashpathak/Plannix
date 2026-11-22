import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Register, { validateRegister } from "../pages/Register";
import { renderWithProviders } from "./renderWithProviders";

describe("validateRegister", () => {
  const good = { name: "Asha", email: "a@b.co", password: "Passw0rd123", confirm: "Passw0rd123" };
  it("accepts valid values", () => expect(validateRegister(good)).toEqual({}));
  it("flags short names, bad emails, weak passwords and mismatches", () => {
    expect(validateRegister({ ...good, name: "A" }).name).toBeTruthy();
    expect(validateRegister({ ...good, email: "nope" }).email).toBeTruthy();
    expect(validateRegister({ ...good, password: "short1", confirm: "short1" }).password).toMatch(/8 characters/);
    expect(validateRegister({ ...good, password: "onlyletters", confirm: "onlyletters" }).password).toMatch(/letter and one number/);
    expect(validateRegister({ ...good, confirm: "different1" }).confirm).toMatch(/do not match/);
  });
});

describe("Register page", () => {
  it("blocks submission when passwords differ", async () => {
    const register = vi.fn();
    renderWithProviders(<Register />, { auth: { register } });
    await userEvent.type(screen.getByLabelText("Full name"), "Asha Verma");
    await userEvent.type(screen.getByLabelText("Email"), "asha@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Passw0rd123");
    await userEvent.type(screen.getByLabelText("Confirm password"), "Passw0rd999");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("calls register (without the confirm field) when valid", async () => {
    const register = vi.fn().mockResolvedValue({});
    renderWithProviders(<Register />, { auth: { register } });
    await userEvent.type(screen.getByLabelText("Full name"), "Asha Verma");
    await userEvent.type(screen.getByLabelText("Email"), "asha@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Passw0rd123");
    await userEvent.type(screen.getByLabelText("Confirm password"), "Passw0rd123");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => expect(register).toHaveBeenCalledWith({ name: "Asha Verma", email: "asha@example.com", password: "Passw0rd123" }));
  });

  it("shows inline server field errors (e.g. duplicate email)", async () => {
    const register = vi.fn().mockRejectedValue({ response: { status: 409, data: { message: "An account with this email already exists" } } });
    renderWithProviders(<Register />, { auth: { register } });
    await userEvent.type(screen.getByLabelText("Full name"), "Asha Verma");
    await userEvent.type(screen.getByLabelText("Email"), "asha@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Passw0rd123");
    await userEvent.type(screen.getByLabelText("Confirm password"), "Passw0rd123");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("already exists");
  });
});
