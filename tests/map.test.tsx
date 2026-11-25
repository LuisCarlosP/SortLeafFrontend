import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import RecyclingMap from "../src/pages/Map/RecyclingMap";
import { fetchRecyclingPoints, getCurrentPosition, type RecyclingPoint, type RecyclingPointsResponse } from "../src/services/location";
vi.mock("../src/services/location", async (original) => ({
  ...(await original<typeof import("../src/services/location")>()),
  fetchRecyclingPoints: vi.fn(),
  getCurrentPosition: vi.fn(),
}));
const map = vi.hoisted(() => ({
  getCenter: (): { lat: number; lng: number } => ({ lat: 9.93, lng: -84.08 }),
  setView: vi.fn(),
  fitBounds: vi.fn(),
  getSize: () => ({ x: 400, y: 800 }),
}));
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  Marker: ({
    title,
    eventHandlers,
  }: {
    title: string;
    eventHandlers?: { click: () => void };
  }) => <button onClick={eventHandlers?.click}>{title}</button>,
  TileLayer: () => null,
  ZoomControl: () => null,
  useMap: () => map,
}));
const api = vi.mocked(fetchRecyclingPoints);
function searchResult(points: RecyclingPoint[], radius = 50000, partial = false): RecyclingPointsResponse {
  return { success: true, center: { latitude: 9.93, longitude: -84.08 }, count: points.length, radius, partial, points };
}
beforeEach(() => {
  vi.mocked(getCurrentPosition).mockReset();
  map.setView.mockClear();
  map.fitBounds.mockClear();
  api.mockReset();
  api.mockResolvedValue(searchResult([
    {
      id: "one",
      name: "Punto de vidrio",
      latitude: 9.93,
      longitude: -84.08,
      types: ["glass"],
      address: "Avenida central",
      website: "javascript:alert(1)",
    },
    {
      id: "two",
      name: "Punto de plástico",
      latitude: 9.94,
      longitude: -84.09,
      types: ["plastic"],
      address: "Barrio norte",
      distance: 450,
    },
  ]));
});
afterEach(cleanup);
it("filters visible points by material and opens the selected point", async () => {
  const user = userEvent.setup();
  render(<RecyclingMap language="es" />);
  await screen.findByRole("button", { name: "Punto de vidrio" });
  await user.click(
    screen.getByRole("button", { name: "Todos los materiales" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Plástico", exact: true }),
  );
  expect(screen.queryByRole("button", { name: "Punto de vidrio" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Punto de plástico" }));
  expect(
    screen.getByRole("heading", { name: "Punto de plástico" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("link", { name: /Cómo llegar/ }).getAttribute("href"),
  ).toContain("destination=9.94,-84.09");
});
it("opens with nearby points and no manual search controls", async () => {
  render(<RecyclingMap language="es" />);
  await screen.findByRole("button", { name: "Punto de vidrio" });
  expect(screen.queryByRole("search")).toBeNull();
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.queryByRole("button", { name: "Buscar en esta zona" })).toBeNull();
  expect(api).toHaveBeenCalledWith(9.9325, -84.0796, [], expect.any(AbortSignal));
});
it("does not render unsafe website links", async () => {
  const user = userEvent.setup();
  render(<RecyclingMap language="es" />);
  await user.click(
    await screen.findByRole("button", { name: "Punto de vidrio" }),
  );
  expect(screen.queryByRole("link", { name: "Sitio web" })).toBeNull();
});
it("offers another search after a network failure", async () => {
  api.mockRejectedValueOnce(new Error("offline"));
  const user = userEvent.setup();
  render(<RecyclingMap language="es" />);
  await screen.findByText(
    "No pudimos cargar los puntos.",
  );
  await user.click(screen.getByRole("button", { name: "Reintentar" }));
  await screen.findByRole("button", { name: "Punto de vidrio" });
  expect(api).toHaveBeenCalledTimes(2);
});

it("uses previously granted location for the first query and subsequent filters", async () => {
  const original = Object.getOwnPropertyDescriptor(navigator, "permissions");
  Object.defineProperty(navigator, "permissions", { configurable: true, value: {
    query: vi.fn().mockResolvedValue({ state: "granted" }),
  } });
  vi.mocked(getCurrentPosition).mockResolvedValue({ latitude: 10.1, longitude: -84.2 });
  try {
    const user = userEvent.setup();
    render(<RecyclingMap language="es" />);
    await screen.findByRole("button", { name: "Punto de vidrio" });
    expect(api).toHaveBeenCalledTimes(1);
    expect(api).toHaveBeenCalledWith(10.1, -84.2, [], expect.any(AbortSignal));
    await user.click(screen.getByRole("button", { name: "Todos los materiales" }));
    await user.click(screen.getByRole("button", { name: "Vidrio", exact: true }));
    await waitFor(() => expect(api).toHaveBeenLastCalledWith(10.1, -84.2, ["glass"], expect.any(AbortSignal)));
  } finally {
    if (original) Object.defineProperty(navigator, "permissions", original);
    else Reflect.deleteProperty(navigator, "permissions");
  }
});

it("can switch from the default reference to the current location", async () => {
  vi.mocked(getCurrentPosition).mockResolvedValue({ latitude: 9.86, longitude: -83.92 });
  const user = userEvent.setup();
  render(<RecyclingMap language="es" />);
  await screen.findByRole("button", { name: "Punto de vidrio" });
  expect(getCurrentPosition).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Usar mi ubicación" }));
  await waitFor(() => expect(api).toHaveBeenLastCalledWith(9.86, -83.92, [], expect.any(AbortSignal)));
});

it("limits markers after ranking and filtering, including a point exactly at the search center", async () => {
  const user = userEvent.setup();
  api.mockResolvedValue(searchResult(Array.from({ length: 16 }, (_, index) => ({
    id: String(index), name: "Estación " + index, latitude: 9.9325, longitude: -84.0796,
    distance: index === 0 ? undefined : index * 30, types: [index < 10 ? "glass" : "plastic"],
  })).reverse()));
  render(<RecyclingMap language="es" />);
  await screen.findByText("Los 10 puntos más cercanos");
  expect(screen.getAllByRole("button", { name: /^Estación / }).map(button => button.textContent))
    .toEqual(Array.from({ length: 10 }, (_, index) => "Estación " + index));
  await user.click(screen.getByRole("button", { name: "Todos los materiales" }));
  await user.click(screen.getByRole("button", { name: "Plástico", exact: true }));
  await screen.findByRole("button", { name: "Estación 15" });
  expect(screen.getAllByRole("button", { name: /^Estación / })).toHaveLength(6);
});

it("frames distant results without a distance cutoff", async () => {
  api.mockResolvedValue(searchResult([{
    id: "rural", name: "Centro rural", types: ["paper"], latitude: 12.15, longitude: -84.08,
  }]));
  render(<RecyclingMap language="es" />);
  await screen.findByRole("button", { name: "Centro rural" });
  expect(screen.getByText("1 punto registrado")).toBeTruthy();
  const bounds = map.fitBounds.mock.calls.at(-1)?.[0];
  expect(bounds.contains([12.15, -84.08])).toBe(true);
  expect(bounds.contains([9.9325, -84.0796])).toBe(true);
});
