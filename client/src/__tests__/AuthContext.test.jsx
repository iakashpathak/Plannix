import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../context/AuthContext";
import useAuth from "../hooks/useAuth";
import * as authService from "../services/authService";

vi.mock("../services/authService");

function Probe() {
  const { user, loading, login, logout } = useAuth();
  if (loading) return <p>loading</p>;
  return (
    <div>
      <p data-testid="who">{user ? user.name : "anonymous"}</p>
      <button onClick={() => login({ email: "a@b.co", password: "x" })}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => vi.resetAllMocks());

  it("restores the session from /auth/me on first load", async () => {
    authService.getMe.mockResolvedValue({ name: "Asha" });
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByTestId("who")).toHaveTextContent("Asha");
  });

  it("is anonymous when /auth/me fails with 401", async () => {
    authService.getMe.mockRejectedValue({ response: { status: 401 } });
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(await screen.findByTestId("who")).toHaveTextContent("anonymous");
  });

  it("login stores the user and logout clears it (even if the request fails)", async () => {
    authService.getMe.mockRejectedValue({ response: { status: 401 } });
    authService.login.mockResolvedValue({ name: "Asha" });
    authService.logout.mockRejectedValue(new Error("network down"));
    render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByTestId("who");

    await userEvent.click(screen.getByText("login"));
    await waitFor(() => expect(screen.getByTestId("who")).toHaveTextContent("Asha"));

    await userEvent.click(screen.getByText("logout"));
    await waitFor(() => expect(screen.getByTestId("who")).toHaveTextContent("anonymous"));
  });
});
