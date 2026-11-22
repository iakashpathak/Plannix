import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "../App";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import * as authService from "../services/authService";

vi.mock("../services/authService");

describe("App routing (anonymous visitor)", () => {
  const renderAt = (route) =>
    render(
      <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

  it("redirects /dashboard to the login page", async () => {
    authService.getMe.mockRejectedValue({ response: { status: 401 } });
    renderAt("/dashboard");
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("shows the registration page", async () => {
    authService.getMe.mockRejectedValue({ response: { status: 401 } });
    renderAt("/register");
    expect(await screen.findByRole("heading", { name: "Create your account" })).toBeInTheDocument();
  });

  it("shows a 404 page for unknown URLs", async () => {
    authService.getMe.mockRejectedValue({ response: { status: 401 } });
    renderAt("/does-not-exist");
    expect(await screen.findByText("This page doesn’t exist")).toBeInTheDocument();
  });
});
