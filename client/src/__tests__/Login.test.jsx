import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Login from "../pages/Login";
import { renderWithProviders } from "./renderWithProviders";

const ui = (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={<p>dashboard reached</p>} />
  </Routes>
);

describe("Login page", () => {
  it("shows validation errors and does not call the API when the form is empty", async () => {
    const login = vi.fn();
    renderWithProviders(ui, { route: "/login", auth: { login } });
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("rejects a malformed email", async () => {
    renderWithProviders(ui, { route: "/login" });
    await userEvent.type(screen.getByLabelText("Email"), "not-an-email");
    await userEvent.type(screen.getByLabelText("Password"), "x");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
  });

  it("submits trimmed credentials and navigates to the dashboard on success", async () => {
    const login = vi.fn().mockResolvedValue({});
    renderWithProviders(ui, { route: "/login", auth: { login } });
    await userEvent.type(screen.getByLabelText("Email"), "  asha@example.com ");
    await userEvent.type(screen.getByLabelText("Password"), "Passw0rd123");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    await waitFor(() => expect(login).toHaveBeenCalledWith({ email: "asha@example.com", password: "Passw0rd123" }));
    expect(await screen.findByText("dashboard reached")).toBeInTheDocument();
  });

  it("shows the server's error message when login fails", async () => {
    const login = vi.fn().mockRejectedValue({ response: { status: 401, data: { message: "Invalid email or password" } } });
    renderWithProviders(ui, { route: "/login", auth: { login } });
    await userEvent.type(screen.getByLabelText("Email"), "asha@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(screen.getByRole("button", { name: /log in/i })).toBeEnabled();
  });
});
