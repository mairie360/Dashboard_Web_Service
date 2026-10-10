import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
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
  it("keeps invalid deadline text and only selectable valid events from a partial bootstrap", async () => {
    const payload = bootstrap({ events: [
      { id: "bad", title: "Impossible day", date: "2026-02-31", startTime: "09:00" },
      { id: "good", title: "Valid leap day", date: "2028-02-29", startTime: "09:00" },
    ] });
    payload.projects[0].dueDate = "3";
    vi.mocked(requestBff).mockResolvedValue(payload);
    await openDashboard();
    expect(screen.getByRole("button", { name: /Projet test/ }).textContent).toContain("Échéance: 3");
    expect(screen.getByRole("button", { name: /Projet test/ }).textContent).not.toContain("2001");
    expect(screen.queryByRole("button", { name: /Impossible day/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Valid leap day/ })).toBeTruthy();
    expect(screen.getByText(/Certains événements reçus ont une date ou une heure illisible/)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Actualiser les dates illisibles" })).toHaveLength(1);
    expect(requestBff).toHaveBeenCalledTimes(1);
  });

  it("does not announce an empty calendar for unusable dates and recovers to confirmed empty through explicit GET", async () => {
    vi.mocked(requestBff).mockResolvedValueOnce(bootstrap({ events: [
      { id: "bad", title: "Impossible time", date: "2026-10-06", startTime: "24:00" },
    ] })).mockResolvedValueOnce(bootstrap({ events: [] }));
    await openDashboard();
    expect(screen.queryByText("Aucun événement à venir.")).toBeNull();
    const unavailable = screen.getByRole("region", { name: "Événements à venir" });
    expect(within(unavailable).getByRole("status").textContent).toContain("Les événements reçus ne peuvent pas être affichés");
    expect(within(unavailable).getByRole("button", { name: "Voir tout" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Impossible time/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Actualiser les dates illisibles" }));
    await screen.findByText("Aucun événement à venir.");
    expect(screen.queryByText(/Certains événements reçus/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Actualiser les dates illisibles" })).toBeNull();
    expect(requestBff).toHaveBeenCalledTimes(2);
    expect(vi.mocked(requestBff).mock.calls.every(([url]) => url === "/dashboard/bootstrap")).toBe(true);
  });

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
    expect([...screen.getByRole("main").childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() === "0")).toBe(false);
    expect(screen.queryByRole("heading", { name: "Actions rapides" })).toBeNull();
  });

  it("preserves the heading, ordered cards and their existing controls", async () => {
    await openDashboard();
    const heading = screen.getByRole("heading", { name: "Tableau de Bord" });
    const pageSection = heading.closest("section");
    const cardHeadings = within(pageSection).getAllByRole("heading", { level: 2 });
    expect(cardHeadings.map(node => node.textContent)).toEqual([
      "Projets récents", "Tâches en attente", "Événements à venir",
    ]);
    const cardGrid = cardHeadings[0].closest("section").parentElement;
    expect(heading.closest("header").nextElementSibling).toBe(cardGrid);
    expect(cardHeadings.every(node => node.closest("section").parentElement === cardGrid)).toBe(true);
    expect(within(pageSection).getAllByRole("button", { name: "Voir tout", exact: true })).toHaveLength(3);
    // JSDOM does not lay out the compiled utility CSS. Pixel gaps and responsive
    // tracks are measured separately in the native browser on the final main.
  });

  it("keeps long DTO titles in the scoped responsive cards with their controls", async () => {
    const longTitle = "DashboardTitleWithoutSpaces".repeat(12);
    const payload = bootstrap();
    payload.projects[0].title = longTitle;
    payload.tasks[0].title = longTitle;
    payload.events[0].title = longTitle;
    payload.events[0].location = longTitle;
    vi.mocked(requestBff).mockResolvedValue(payload);
    await openDashboard();

    const grid = screen.getByRole("heading", { name: "Tableau de Bord" }).closest("section").querySelector(".dashboard-content-grid");
    expect(grid.querySelector(".dashboard-recent-projects")).toBeTruthy();
    expect(grid.querySelector(".dashboard-pending-tasks")).toBeTruthy();
    expect(grid.querySelector(".dashboard-upcoming-events-grid")).toBeTruthy();
    expect(within(grid).getAllByRole("button", { name: "Voir tout" })).toHaveLength(3);
    expect(within(grid).getAllByText(longTitle)).toHaveLength(4);
    expect(requestBff).toHaveBeenCalledTimes(1);
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

  it("recovers an initial failure through keyboard activation without automatically retrying", async () => {
    const user = userEvent.setup();
    vi.mocked(requestBff).mockRejectedValueOnce(new Error("Chargement refusé"));
    render(<Home />);
    const retry = await screen.findByRole("button", { name: "Réessayer le chargement" });
    expect(requestBff).toHaveBeenCalledTimes(1);
    for (let index = 0; index < 20 && document.activeElement !== retry; index += 1) await user.tab();
    expect(document.activeElement).toBe(retry);
    await user.keyboard("{Enter}");
    await screen.findByRole("heading", { name: "Tableau de Bord" });
    expect(requestBff).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button", { name: "Réessayer le chargement" })).toBeNull();
  });

  it("locks partial-source recovery until its one read completes and preserves confirmed cards on refusal", async () => {
    vi.mocked(requestBff).mockResolvedValueOnce(bootstrap({ events: [], sources: { projects: "available", tasks: "available", calendar: "unavailable" } }));
    const user = await openDashboard();
    let refuse;
    vi.mocked(requestBff).mockImplementationOnce(() => new Promise((resolve, reject) => { refuse = reject; }));
    const retry = screen.getByRole("button", { name: "Actualiser les données indisponibles" });
    await user.dblClick(retry);
    expect(requestBff).toHaveBeenCalledTimes(2);
    expect(retry.disabled).toBe(true);
    expect(retry.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("button", { name: /Projet test/ })).toBeTruthy();
    await act(async () => refuse(new Error("Actualisation refusée")));
    expect((await screen.findByRole("alert")).textContent).toBe("Actualisation refusée");
    expect(screen.getByRole("button", { name: /Projet test/ })).toBeTruthy();
    expect(screen.getByText("Les dernières données reçues restent affichées.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Réessayer le chargement" }));
    await screen.findByRole("button", { name: /Événement test/ });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(requestBff).toHaveBeenCalledTimes(3);
  });

  it("aborts a pending read on unmount without a new request", async () => {
    let finish;
    let signal;
    vi.mocked(requestBff).mockImplementation((path, init) => {
      signal = init.signal;
      return new Promise((resolve) => { finish = resolve; });
    });
    const mounted = render(<Home />);
    mounted.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => finish(bootstrap()));
    expect(requestBff).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("heading", { name: "Tableau de Bord" })).toBeNull();
  });

  it("guards consecutive recovery events before the disabled state renders", async () => {
    vi.mocked(requestBff).mockResolvedValueOnce(bootstrap({ events: [], sources: { projects: "available", tasks: "available", calendar: "unavailable" } }));
    await openDashboard();
    let finish;
    vi.mocked(requestBff).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const retry = screen.getByRole("button", { name: "Actualiser les données indisponibles" });
    act(() => { fireEvent.click(retry); fireEvent.click(retry); });
    expect(requestBff).toHaveBeenCalledTimes(2);
    expect(retry.disabled).toBe(true);
    await act(async () => finish(bootstrap()));
    expect(screen.queryByRole("button", { name: "Actualiser les données indisponibles" })).toBeNull();
  });

  it("does not turn a logout failure into a bootstrap retry or hide confirmed cards", async () => {
    const user = await openDashboard();
    await user.click(screen.getByRole("button", { name: /Test/ }));
    await user.click(await screen.findByText("Déconnexion", { exact: true }));
    expect((await screen.findByRole("alert")).textContent).toBe("La déconnexion est temporairement indisponible.");
    expect(screen.getByRole("button", { name: /Projet test/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Réessayer le chargement" })).toBeNull();
    expect(requestBff).toHaveBeenCalledTimes(1);
  });

  it("ignores an aborted StrictMode read even when it resolves after the replacement", async () => {
    const reads = [];
    vi.mocked(requestBff).mockImplementation((path, init) => new Promise((resolve) => reads.push({ signal: init.signal, resolve })));
    render(<StrictMode><Home /></StrictMode>);
    expect(reads).toHaveLength(2);
    expect(reads[0].signal.aborted).toBe(true);
    await act(async () => reads[1].resolve(bootstrap({ userFirstName: "Réponse actuelle" })));
    await screen.findByText("Bienvenue Réponse actuelle, voici un aperçu de vos activités");
    await act(async () => reads[0].resolve(bootstrap({ userFirstName: "Réponse obsolète" })));
    expect(screen.getByText("Bienvenue Réponse actuelle, voici un aperçu de vos activités")).toBeTruthy();
    expect(screen.queryByText(/Réponse obsolète/)).toBeNull();
  });

  it("recovers to confirmed empty data without clearing an independent logout refusal", async () => {
    const user = userEvent.setup();
    vi.mocked(requestBff).mockRejectedValueOnce(new Error("Lecture initiale refusée"));
    render(<Home />);
    await screen.findByText("Lecture initiale refusée");
    vi.mocked(requestBff).mockResolvedValueOnce(bootstrap({
      events: [], sources: { projects: "available", tasks: "available", calendar: "unavailable" },
    }));
    await user.click(screen.getByRole("button", { name: "Réessayer le chargement" }));
    await screen.findByRole("button", { name: /Projet test/ });

    let refuse;
    vi.mocked(requestBff).mockImplementationOnce(() => new Promise((resolve, reject) => { refuse = reject; }));
    const refresh = screen.getByRole("button", { name: "Actualiser les données indisponibles" });
    act(() => { fireEvent.click(refresh); fireEvent.click(refresh); });
    expect(requestBff).toHaveBeenCalledTimes(3);
    expect(refresh.disabled).toBe(true);
    await act(async () => refuse(new Error("Nouvelle lecture refusée")));
    await screen.findByText("Nouvelle lecture refusée");
    expect(screen.getByRole("button", { name: /Projet test/ })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Test/ }));
    await user.click(await screen.findByText("Déconnexion", { exact: true }));
    await screen.findByText("La déconnexion est temporairement indisponible.");
    expect(requestBff).toHaveBeenCalledTimes(3);

    vi.mocked(requestBff).mockResolvedValueOnce(bootstrap({
      projects: [], tasks: [], events: [], userFirstName: "Confirmé", metrics: { totalProjects: 0 },
    }));
    await user.click(screen.getByRole("button", { name: "Réessayer le chargement" }));
    await screen.findByText("Bienvenue Confirmé, voici un aperçu de vos activités");
    expect(screen.getByText("Aucun projet récent.")).toBeTruthy();
    expect(screen.getByText("Aucune tâche en attente.")).toBeTruthy();
    expect(screen.getByText("Aucun événement à venir.")).toBeTruthy();
    expect(screen.queryByText("Nouvelle lecture refusée")).toBeNull();
    expect(screen.queryByRole("button", { name: "Réessayer le chargement" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Projet test/ })).toBeNull();
    expect(screen.getByRole("alert").textContent).toBe("La déconnexion est temporairement indisponible.");
    expect(requestBff).toHaveBeenCalledTimes(4);
    expect(vi.mocked(requestBff).mock.calls.every(([path]) => path === "/dashboard/bootstrap")).toBe(true);
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
