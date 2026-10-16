import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import IncidentDashboard from "@/components/incidents/IncidentDashboard";
import IncidentForm from "@/components/incidents/IncidentForm";
import { getIncidents } from "@/lib/incidents";


const incident = {
  id: 1,
  title: "Pedido detenido",
  description: "No se puede confirmar el pedido",
  category: "other",
  status: "open" as const,
  origin: "branch" as const,
  branch: "central" as const,
  created_at: "2026-10-03T10:00:00+00:00",
  updated_at: "2026-10-03T10:00:00+00:00",
};

const summary = {
  total: 1,
  by_status: { open: 1 },
  by_category: { other: 1 },
  by_origin: { branch: 1 },
  by_branch: { central: 1 },
};

function response(body: unknown, status = 200): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function setValue(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(element),
    "value",
  )?.set;
  setter?.call(element, value);
  if (element instanceof HTMLSelectElement) {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

async function render(component: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(component);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return {
    container,
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as typeof fetch;
});

describe("incident form", () => {
  it("validates required fields before sending and highlights branch origin", async () => {
    const mounted = await render(createElement(IncidentForm));
    const form = mounted.container.querySelector("form")!;

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(mounted.container.textContent).toContain("El título es obligatorio");
    expect(mounted.container.textContent).toContain("La descripción es obligatoria");
    expect(fetchMock).not.toHaveBeenCalled();

    const origin = mounted.container.querySelector("#incident-origin") as HTMLSelectElement;
    await act(async () => setValue(origin, "branch"));
    expect(mounted.container.querySelector("#incident-branch")?.parentElement?.className)
      .toContain("branchRequired");

    await mounted.unmount();
  });

  it("shows API field errors, loading/disabled state, then success and resets", async () => {
    let resolvePost!: (value: Response) => void;
    fetchMock
      .mockResolvedValueOnce(response({
        error: "validation_error",
        field: "category",
        message: "La categoría seleccionada no es válida",
      }, 400))
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolvePost = resolve;
      }));

    const mounted = await render(createElement(IncidentForm));
    const form = mounted.container.querySelector("form")!;
    const fillForm = async () => {
      await act(async () => {
        setValue(mounted.container.querySelector("#incident-title") as HTMLInputElement, "Pedido detenido");
        setValue(mounted.container.querySelector("#incident-description") as HTMLTextAreaElement, "Detalle del problema");
        setValue(mounted.container.querySelector("#incident-category") as HTMLSelectElement, "other");
        setValue(mounted.container.querySelector("#incident-origin") as HTMLSelectElement, "internal");
        setValue(mounted.container.querySelector("#incident-branch") as HTMLSelectElement, "central");
      });
    };

    await fillForm();
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mounted.container.textContent).toContain("La categoría seleccionada no es válida");

    await fillForm();
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });
    const button = mounted.container.querySelector("button[type='submit']") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain("Guardando...");

    await act(async () => {
      resolvePost(response({ ...incident, title: "Pedido detenido" }, 201));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(button.disabled).toBe(false);
    expect(mounted.container.textContent).toContain("Incidencia registrada correctamente.");
    expect((mounted.container.querySelector("#incident-title") as HTMLInputElement).value).toBe("");

    await mounted.unmount();
  });
});

describe("incident dashboard", () => {
  it("reserves all four summary groups while loading and keeps placeholders after data arrives", async () => {
    let resolveSummary!: (value: Response) => void;
    fetchMock.mockImplementation((input: RequestInfo | URL) => (
      String(input).includes("/summary")
        ? new Promise((resolve) => { resolveSummary = resolve; })
        : Promise.resolve(response([incident]))
    ));
    const mounted = await render(createElement(IncidentDashboard));
    const summarySection = mounted.container.querySelector("[aria-labelledby='incident-summary-title']")!;

    expect(summarySection.getAttribute("aria-busy")).toBe("true");
    expect(summarySection.querySelectorAll(".summaryGroup")).toHaveLength(4);
    expect(summarySection.querySelectorAll("[data-loading='true']")).toHaveLength(4);
    expect(summarySection.querySelectorAll(".summaryPlaceholder div")).toHaveLength(21);
    expect(mounted.container.textContent).toContain("Pedido detenido");

    await act(async () => {
      resolveSummary(response(summary));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(summarySection.getAttribute("aria-busy")).toBe("false");
    expect(summarySection.querySelectorAll("[data-loading='true']")).toHaveLength(0);
    expect(summarySection.querySelectorAll(".summaryPlaceholder[aria-hidden='true']")).toHaveLength(4);
    expect(summarySection.textContent).toContain("1 incidencias registradas");
    expect(summarySection.querySelectorAll("dl:not([aria-hidden]) dd")).toHaveLength(4);
    await mounted.unmount();
  });

  it("keeps the previous summary visible while a successful status update refreshes it", async () => {
    let resolveRefresh!: (value: Response) => void;
    let summaryCalls = 0;
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/summary")) {
        summaryCalls += 1;
        return summaryCalls === 1
          ? Promise.resolve(response(summary))
          : new Promise((resolve) => { resolveRefresh = resolve; });
      }
      if (url.endsWith("/1/status")) {
        return Promise.resolve(response({ ...incident, status: "in_progress" }));
      }
      return Promise.resolve(response([incident]));
    });
    const mounted = await render(createElement(IncidentDashboard));
    const summarySection = mounted.container.querySelector("[aria-labelledby='incident-summary-title']")!;
    const statusSelect = mounted.container.querySelector(
      "select[aria-label='Cambiar estado de Pedido detenido']",
    ) as HTMLSelectElement;

    await act(async () => {
      setValue(statusSelect, "in_progress");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(summarySection.getAttribute("aria-busy")).toBe("true");
    expect(summarySection.querySelectorAll("dl:not([aria-hidden]) dd")).toHaveLength(4);
    expect(summarySection.querySelectorAll("[data-loading='true']")).toHaveLength(0);

    await act(async () => {
      resolveRefresh(response({ ...summary, by_status: { in_progress: 1 } }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(summarySection.getAttribute("aria-busy")).toBe("false");
    expect(summarySection.querySelector("dl:not([aria-hidden])")?.textContent).toContain("En curso");
    await mounted.unmount();
  });

  it("keeps the list usable if the summary fails and renders all filters", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => (
      String(input).includes("/summary")
        ? Promise.reject(new Error("summary offline"))
        : Promise.resolve(response([]))
    ));
    const mounted = await render(createElement(IncidentDashboard));

    expect(mounted.container.textContent).toContain("No se pudo cargar el resumen.");
    expect(mounted.container.textContent).toContain("No hay incidencias para los filtros seleccionados.");

    expect(mounted.container.querySelectorAll(".filters select")).toHaveLength(4);
    expect(mounted.container.textContent).toContain("No hay incidencias para los filtros seleccionados.");

    await mounted.unmount();
  });

  it("serializes combined filters for the list endpoint", async () => {
    fetchMock.mockResolvedValueOnce(response([]));
    await expect(getIncidents({
      status: "open",
      origin: "branch",
      branch: "central",
      category: "other",
    })).resolves.toEqual([]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/backend/api/incidents?status=open&origin=branch&branch=central&category=other",
    );
  });

  it("shows list loading, error, and a successful retry", async () => {
    let rejectFirstList!: (reason: Error) => void;
    let listCalls = 0;
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      if (String(input).includes("/summary")) return Promise.resolve(response(summary));
      listCalls += 1;
      if (listCalls === 1) {
        return new Promise((_resolve, reject) => {
          rejectFirstList = reject;
        });
      }
      return Promise.resolve(response([incident]));
    });

    const mounted = await render(createElement(IncidentDashboard));
    expect(mounted.container.textContent).toContain("Cargando incidencias...");

    await act(async () => {
      rejectFirstList(new Error("offline"));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mounted.container.textContent).toContain("No pudimos cargar las incidencias.");

    const retryButton = Array.from(mounted.container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Reintentar"));
    expect(retryButton).toBeDefined();
    await act(async () => {
      retryButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mounted.container.textContent).toContain("Pedido detenido");

    await mounted.unmount();
  });

  it("updates a status optimistically and rolls it back when PATCH fails", async () => {
    let resolvePatch!: (value: Response) => void;
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/summary")) return Promise.resolve(response(summary));
      if (url.endsWith("/1/status")) {
        return new Promise((resolve) => {
          resolvePatch = resolve;
        });
      }
      return Promise.resolve(response([incident]));
    });

    const mounted = await render(createElement(IncidentDashboard));
    const statusSelect = mounted.container.querySelector(
      "select[aria-label='Cambiar estado de Pedido detenido']",
    ) as HTMLSelectElement;
    expect(statusSelect).not.toBeNull();

    await act(async () => {
      setValue(statusSelect, "in_progress");
      await Promise.resolve();
    });
    expect(mounted.container.textContent).toContain("En curso");

    await act(async () => {
      resolvePatch(response({
        error: "invalid_status_transition",
        field: "status",
        message: "No se pudo actualizar el estado.",
      }, 400));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mounted.container.textContent).toContain("Abierta");
    expect(mounted.container.textContent).toContain("No se pudo actualizar el estado.");

    await mounted.unmount();
  });
});