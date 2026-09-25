import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { requestBff } from "@/lib/bff-client";
import { frontUrl } from "@/lib/front-urls";

vi.mock("@/lib/bff-client", () => ({ requestBff: vi.fn() }));
vi.mock("@/lib/front-urls", () => ({ frontUrl: vi.fn(() => undefined) }));

function bootstrap(overrides = {}) {
  return {
    userFirstName: "Test",
    projects: [
      { id: "project-1", title: "Projet test", progress: 25, status: "review", dueDate: "2026-09-20" },
    ],
    tasks: [
      { id: "task-1", title: "Tâche test", dueDate: "2026-09-21", priority: "high", completed: false, projectId: "project-1" },
    ],
    events: [
      { id: 1, title: "Événement test", date: "2026-09-22", startTime: "10:00", location: "Salle test" },
    ],
    metrics: { totalProjects: 1 },
    sources: { projects: "available", tasks: "available", calendar: "available" },
    ...overrides,
  };
}

async function openDashboard() {
  const user = userEvent.setup();
  render(<Home />);
  await screen.findByRole("heading", { name: "Tableau de Bord" });
  return user;
}

beforeEach(() => {
  vi.mocked(requestBff).mockResolvedValue(bootstrap());
});

describe("Dashboard page", () => {
  it("loads only the published bootstrap and renders DTO-backed cards", async () => {
    let resolveBootstrap;
    vi.mocked(requestBff).mockImplementation(() => new Promise((resolve) => {
      resolveBootstrap = resolve;
    }));
    render(<Home />);
    expect(screen.getByRole("status").textContent).toContain("Chargement");
    await act(async () => resolveBootstrap(bootstrap()));
    await screen.findByRole("heading", { name: "Tableau de Bord" });

    expect(requestBff).toHaveBeenCalledTimes(1);
    expect(requestBff).toHaveBeenCalledWith("/dashboard/bootstrap", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(screen.getByRole("button", { name: /Projet test/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Tâche test/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Événement test/ })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Actions rapides" })).toBeNull();
  });

  it("shows empty sections instead of invented cards", async () => {
    vi.mocked(requestBff).mockResolvedValue(bootstrap({ projects: [], tasks: [], events: [] }));
    await openDashboard();

    expect(screen.getByText("Aucun projet récent.")).toBeTruthy();
    expect(screen.getByText("Aucune tâche en attente.")).toBeTruthy();
    expect(screen.getByText("Aucun événement à venir.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Projet test|Tâche test|Événement test/ })).toBeNull();
  });

  it("warns when one BFF source is unavailable without inventing its data", async () => {
    vi.mocked(requestBff).mockResolvedValue(bootstrap({
      events: [],
      sources: { projects: "available", tasks: "available", calendar: "unavailable" },
    }));
    await openDashboard();

    expect(screen.getByRole("status").textContent).toContain("temporairement indisponibles");
    expect(screen.getByText("Aucun événement à venir.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Événement test/ })).toBeNull();
  });

  it("shows a controlled error when bootstrap fails", async () => {
    vi.mocked(requestBff).mockRejectedValue(new Error("Service indisponible"));
    render(<Home />);

    expect((await screen.findByRole("alert")).textContent).toBe("Service indisponible");
    expect(screen.getByRole("status").textContent).toContain("indisponible");
    expect(screen.queryByRole("heading", { name: "Tableau de Bord" })).toBeNull();
  });

  it("keeps section controls keyboard-reachable and free of serious axe violations", async () => {
    const user = await openDashboard();
    const projects = screen.getByRole("heading", { name: "Projets récents" }).closest("section");
    expect(within(projects).getByRole("button", { name: "Voir tous" })).toBeTruthy();
    await user.tab();
    expect(document.activeElement).toBe(within(projects).getByRole("button", { name: "Voir tous" }));

    const results = await axe(document.querySelector("main"));
    expect(results.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([]);
    expect(frontUrl).not.toHaveBeenCalled();
  });
});
