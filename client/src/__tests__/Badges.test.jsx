import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PriorityBadge, StatusBadge } from "../components/Badges";
import { FlowBar } from "../components/ProgressBar";

describe("badges", () => {
  it("renders the task status text", () => {
    render(<StatusBadge status="In Progress" />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });
  it("renders the priority text", () => {
    render(<PriorityBadge priority="High" />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});

describe("FlowBar", () => {
  it("describes the split accessibly", () => {
    render(<FlowBar completed={3} inProgress={2} pending={1} />);
    expect(screen.getByRole("img", { name: "3 completed, 2 in progress, 1 pending" })).toBeInTheDocument();
  });
  it("handles zero tasks without crashing", () => {
    render(<FlowBar />);
    expect(screen.getByRole("img", { name: "0 completed, 0 in progress, 0 pending" })).toBeInTheDocument();
  });
  it("fills the bar completely when all tasks are completed", () => {
    render(<FlowBar completed={1} />);
    const bar = screen.getByRole("img", { name: "1 completed, 0 in progress, 0 pending" });
    expect(bar.children).toHaveLength(1);
    expect(bar.firstElementChild).toHaveClass("bg-done");
    expect(bar.firstElementChild).toHaveStyle({ width: "100%" });
  });
});
