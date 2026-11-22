import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "../pages/Dashboard";
import * as dashboardService from "../services/dashboardService";
import * as projectService from "../services/projectService";
import { renderWithProviders, testUser } from "./renderWithProviders";

vi.mock("../services/dashboardService");
vi.mock("../services/projectService");

const stats = { totalProjects: 2, totalTasks: 6, completedTasks: 3, pendingTasks: 2, inProgressTasks: 1, overdueTasks: 1, completionRate: 50 };

describe("Dashboard page", () => {
  beforeEach(() => vi.resetAllMocks());

  it("renders greeting, stats, activity and project progress from the API", async () => {
    dashboardService.getDashboard.mockResolvedValue({
      stats,
      recentActivities: [{ _id: "a1", action: "created", entityType: "task", entityName: "Write report", createdAt: new Date().toISOString() }],
      upcomingTasks: [{ _id: "t1", title: "Submit report", priority: "High", status: "Pending", dueDate: "2099-01-01T00:00:00Z", project: { name: "Alpha" } }],
    });
    projectService.getProjects.mockResolvedValue([{ _id: "p1", name: "Alpha", taskCounts: { total: 4, completed: 2, pending: 1, inProgress: 1 } }]);

    renderWithProviders(<Dashboard />, { auth: { user: testUser } });

    expect(await screen.findByText("Total projects")).toBeInTheDocument();
    const greeting = screen.getByRole("heading", { level: 1 });
    const overallProgress = screen.getByRole("heading", { name: "Task flow" });
    expect(greeting).toHaveTextContent(/Asha/);
    expect(greeting.compareDocumentPosition(overallProgress) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("Completed tasks").previousSibling).toHaveTextContent("3");
    expect(screen.getByText("Pending tasks").previousSibling).toHaveTextContent("3"); // pending + in progress
    expect(screen.getByText("Write report")).toBeInTheDocument();
    expect(screen.getByText("Submit report")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Alpha progress" })).toHaveAttribute("aria-valuenow", "50");
  });

  it("shows an empty state for a brand-new account", async () => {
    dashboardService.getDashboard.mockResolvedValue({ stats: { ...stats, totalProjects: 0, totalTasks: 0, completedTasks: 0, pendingTasks: 0, inProgressTasks: 0, overdueTasks: 0, completionRate: 0 }, recentActivities: [], upcomingTasks: [] });
    projectService.getProjects.mockResolvedValue([]);
    renderWithProviders(<Dashboard />, { auth: { user: testUser } });
    expect(await screen.findByText("No tasks yet")).toBeInTheDocument();
  });

  it("shows an error message with a retry button when the API fails", async () => {
    dashboardService.getDashboard.mockRejectedValue({ response: { data: { message: "Database is unavailable." } } });
    projectService.getProjects.mockResolvedValue([]);
    renderWithProviders(<Dashboard />, { auth: { user: testUser } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Database is unavailable.");
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
