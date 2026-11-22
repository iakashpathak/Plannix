import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";

export const testUser = { _id: "u1", name: "Asha Verma", email: "asha@example.com", role: "user", createdAt: "2030-01-01T00:00:00Z" };

// Renders a component inside a router, toast provider and a fake AuthContext so tests control "who is logged in".
export function renderWithProviders(ui, { route = "/", auth = {} } = {}) {
  const value = { user: null, loading: false, login: async () => {}, register: async () => {}, logout: async () => {}, setUser: () => {}, ...auth };
  return render(
    <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <AuthContext.Provider value={value}>{ui}</AuthContext.Provider>
      </ToastProvider>
    </MemoryRouter>
  );
}
