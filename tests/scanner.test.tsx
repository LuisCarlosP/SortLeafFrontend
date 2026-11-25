import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ScannerPage from "../src/pages/Scanner/ScannerPage";
import {
  BarcodeLookupError,
  fetchProductByBarcode,
} from "../src/services/barcode";
import {
  createBarcodeVerifier,
  expandUpce,
  isValidGtin,
} from "../src/services/gtin";

vi.mock("../src/services/barcode", async (original) => ({
  ...(await original<typeof import("../src/services/barcode")>()),
  fetchProductByBarcode: vi.fn(),
}));
beforeEach(() => vi.mocked(fetchProductByBarcode).mockReset());
afterEach(cleanup);

it("accepts retail GTIN formats and rejects a changed check digit", () => {
  for (const code of [
    "96385074",
    "036000291452",
    "3017620422003",
    "10012345000017",
  ])
    expect(isValidGtin(code)).toBe(true);
  for (const code of [
    "00000000",
    "3017620422004",
    "123456789",
    "hello",
    "96385075",
  ])
    expect(isValidGtin(code)).toBe(false);
  expect(expandUpce("04252614")).toBe("042100005264");
});

it("requires three matching valid reads and resets on a different or stale code", () => {
  const verify = createBarcodeVerifier();
  expect(verify("3017620422003", 0)).toBeNull();
  expect(verify("3017620422003", 100)).toBeNull();
  expect(verify("3017620422004", 200)).toBeNull();
  expect(verify("3017620422003", 300)).toBeNull();
  expect(verify("3017620422003", 400)).toBeNull();
  expect(verify("3017620422003", 500)).toBe("3017620422003");
  expect(verify("3017620422003", 3000)).toBeNull();
});

it("does not query the catalog for an invalid code", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ScannerPage language="es" />
    </MemoryRouter>,
  );
  await user.type(
    screen.getByLabelText("También puedes escribir el código"),
    "3017620422004",
  );
  await user.click(screen.getByRole("button", { name: "Consultar código" }));
  expect(screen.getByRole("alert").textContent).toContain("no es válido");
  expect(fetchProductByBarcode).not.toHaveBeenCalled();
});

it("distinguishes a correctly read unknown product from unavailable catalogues", async () => {
  const api = vi.mocked(fetchProductByBarcode);
  api
    .mockRejectedValueOnce(new BarcodeLookupError(404))
    .mockRejectedValueOnce(new BarcodeLookupError(503));
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ScannerPage language="es" />
    </MemoryRouter>,
  );
  await user.type(
    screen.getByLabelText("También puedes escribir el código"),
    "3017620422003",
  );
  await user.click(screen.getByRole("button", { name: "Consultar código" }));
  await screen.findByText(/Código leído correctamente/);
  await user.click(screen.getByRole("button", { name: "Consultar código" }));
  await screen.findByText(/Los catálogos están ocupados/);
  expect(api).toHaveBeenCalledWith(
    "3017620422003",
    expect.any(AbortSignal),
    "es",
  );
});
