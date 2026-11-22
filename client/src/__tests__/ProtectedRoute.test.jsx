import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ProtectedRoute, PublicOnlyRoute } from "../components/ProtectedRoute";
import { renderWithProviders, testUser } from "./renderWithProviders";

const tree = (
  <Routes>
    <Route element={<PublicOnlyRoute />}>
      <Route path="/login" element={<p>login page</p>} />
    </Route>
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<p>secret dashboard</p>} />
    </Route>
  </Routes>
);

describe("route guards", () => {
  it("redirects anonymous visitors from a protected page to /login", () => {
    renderWithProviders(tree, { route: "/dashboard", auth: { user: null } });
    expect(screen.getByText("login page")).toBeInTheDocument();
    expect(screen.queryByText("secret dashboard")).not.toBeInTheDocument();
  });

  it("shows the protected page to a logged-in user", () => {
    renderWithProviders(tree, { route: "/dashboard", auth: { user: testUser } });
    expect(screen.getByText("secret dashboard")).toBeInTheDocument();
  });

  it("shows a loading state while the session is being checked (no flash of /login)", () => {
    renderWithProviders(tree, { route: "/dashboard", auth: { loading: true } });
    expect(screen.getByRole("status")).toHaveTextContent(/checking your session/i);
    expect(screen.queryByText("login page")).not.toBeInTheDocument();
  });

  it("sends a logged-in user away from /login to the dashboard", () => {
    renderWithProviders(tree, { route: "/login", auth: { user: testUser } });
    expect(screen.getByText("secret dashboard")).toBeInTheDocument();
  });
});
