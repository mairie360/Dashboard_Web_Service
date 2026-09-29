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

  it("keeps the cards 16px below the heading without changing the card grid", async () => {
    await openDashboard();

    const pageSection = screen.getByRole("heading", { name: "Tableau de Bord" }).closest("section");
    expect(pageSection.classList.contains("space-y-4")).toBe(true);
    expect(pageSection.classList.contains("space-y-6")).toBe(false);
    const cardGrid = pageSection.querySelector(":scope > .grid");
    expect(cardGrid.classList.contains("gap-6")).toBe(true);
    expect(cardGrid.classList.contains("xl:grid-cols-2")).toBe(true);
    expect(within(pageSection).getByRole("heading", { name: "Projets récents" })).toBeTruthy();
    expect(within(pageSection).getByRole("heading", { name: "Tâches en attente" })).toBeTruthy();
    expect(within(pageSection).getByRole("heading", { name: "Événements à venir" })).toBeTruthy();
  });

  it("uses the same neutral action on all three BFF-backed cards", async () => {
    const user = await openDashboard();
    const sections = ["Projets récents", "Tâches en attente", "Événements à venir"]
      .map((name) => screen.getByRole("heading", { name }).closest("section"));
    const actions = sections.map((section) => within(section).getByRole("button", { name: "Voir tout" }));

    expect(actions.map((action) => action.className)).toEqual([
      actions[0].className,
      actions[0].className,
      actions[0].className,
    ]);
    expect(actions[0].className).toContain("border-[#d8d2ca]");
    expect(actions[0].className).toContain("bg-[#fbfaf9]");

    vi.mocked(frontUrl).mockClear();
    for (const action of actions) await user.click(action);
    expect(frontUrl).toHaveBeenNthCalledWith(1, "PROJECT_FRONT_URL");
    expect(frontUrl).toHaveBeenNthCalledWith(2, "PROJECT_FRONT_URL");
    expect(frontUrl).toHaveBeenNthCalledWith(3, "CALENDAR_FRONT_URL");
    expect(frontUrl).toHaveBeenCalledTimes(3);
  });

  it("shows empty sections instead of invented cards", async () => {
    vi.mocked(requestBff).mockResolvedValue(bootstrap({ projects: [], tasks: [], events: [] }));
    await openDashboard();

    expect(screen.getByText("Aucun projet récent.")).toBeTruthy();
    expect(screen.getByText("Aucune tâche en attente.")).toBeTruthy();
    expect(screen.getByText("Aucun événement à venir.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Projet test|Tâche test|Événement test/ })).toBeNull();
  });

  it.each(["", "   "])("shows a neutral greeting without a first name (%j)", async (userFirstName) => {
    vi.mocked(requestBff).mockResolvedValue(bootstrap({ userFirstName }));
    await openDashboard();

    expect(screen.getByText("Voici un aperçu de vos activités")).toBeTruthy();
    expect(screen.queryByText(/Bienvenue\s*,/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Utilisateur" })).toBeNull();
    expect(screen.getByRole("button", { name: /Projet test/ })).toBeTruthy();
  });

  it("trims a nonblank first name in the greeting and account menu", async () => {
    vi.mocked(requestBff).mockResolvedValue(bootstrap({ userFirstName: "  Alice  " }));
    await openDashboard();

    expect(screen.getByText("Bienvenue Alice, voici un aperçu de vos activités")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Alice/ })).toBeTruthy();
    expect(screen.queryByText(/Bienvenue\s{2}|Alice\s{2}/)).toBeNull();
  });

  it("keeps upcoming events in a responsive grid without changing their chronological order", async () => {
    vi.mocked(requestBff).mockResolvedValue(bootstrap({
      events: [
        { id: 3, title: "Dernier rendez-vous", date: "2026-09-24", startTime: "14:00", location: "Salle C" },
        { id: 1, title: "Premier rendez-vous", date: "2026-09-22", startTime: "09:00", location: "Salle A" },
        { id: 2, title: "Deuxième rendez-vous", date: "2026-09-23", startTime: "11:00", location: "Salle B" },
      ],
    }));
    await openDashboard();

    const events = screen.getByRole("heading", { name: "Événements à venir" }).closest("section");
    expect(events.classList.contains("dashboard-upcoming-events-grid")).toBe(true);
    expect(within(events).getAllByRole("button").slice(1).map((button) => button.textContent)).toEqual([
      expect.stringContaining("Premier rendez-vous"),
      expect.stringContaining("Deuxième rendez-vous"),
      expect.stringContaining("Dernier rendez-vous"),
    ]);
    expect(within(events).getByRole("button", { name: "Voir tout" })).toBeTruthy();
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
    const viewAll = within(projects).getByRole("button", { name: "Voir tout" });
    for (let index = 0; index < 12 && document.activeElement !== viewAll; index += 1) {
      await user.tab();
    }
    expect(document.activeElement).toBe(viewAll);

    const results = await axe(document.querySelector("main"));
    expect(results.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([]);
    expect(frontUrl).toHaveBeenCalledWith("PROJECT_FRONT_URL");
  });
});
