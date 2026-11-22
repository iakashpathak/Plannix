import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TaskForm from "../components/TaskForm";

const projects = [
  { _id: "p1", name: "Alpha" },
  { _id: "p2", name: "Beta" },
];

describe("TaskForm", () => {
  it("requires a title and a project", async () => {
    const onSubmit = vi.fn();
    render(<TaskForm projects={projects} onSubmit={onSubmit} onCancel={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /create task/i }));
    expect(await screen.findByText("Task title is required")).toBeInTheDocument();
    expect(screen.getByText("Choose a project")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a clean payload with defaults", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<TaskForm projects={projects} onSubmit={onSubmit} onCancel={() => {}} />);
    await userEvent.type(screen.getByLabelText("Title"), "  Write report ");
    await userEvent.selectOptions(screen.getByLabelText("Project"), "p2");
    await userEvent.selectOptions(screen.getByLabelText("Priority"), "High");
    await userEvent.click(screen.getByRole("button", { name: /create task/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({ title: "Write report", description: "", project: "p2", priority: "High", status: "Pending", dueDate: null });
  });

  it("pre-fills when editing and pre-selects the default project when creating", () => {
    const task = { title: "Existing", description: "d", project: { _id: "p1" }, priority: "Low", status: "Completed", dueDate: "2030-05-20T00:00:00.000Z" };
    const { unmount } = render(<TaskForm initial={task} projects={projects} onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.getByLabelText("Title")).toHaveValue("Existing");
    expect(screen.getByLabelText("Project")).toHaveValue("p1");
    expect(screen.getByLabelText("Due date")).toHaveValue("2030-05-20");
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    unmount();
    render(<TaskForm projects={projects} defaultProject="p2" onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.getByLabelText("Project")).toHaveValue("p2");
  });

  it("shows a server error and re-enables the button", async () => {
    const onSubmit = vi.fn().mockRejectedValue({ response: { data: { message: "Project not found" } } });
    render(<TaskForm projects={projects} defaultProject="p1" onSubmit={onSubmit} onCancel={() => {}} />);
    await userEvent.type(screen.getByLabelText("Title"), "x");
    await userEvent.click(screen.getByRole("button", { name: /create task/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Project not found");
    expect(screen.getByRole("button", { name: /create task/i })).toBeEnabled();
  });
});
