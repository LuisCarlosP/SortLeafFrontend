import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import WorkspaceShell from "../src/components/workspace/WorkspaceShell";
import {
  createConversation,
  deleteConversation,
  getConversationState,
} from "../src/services/conversations";

vi.mock("../src/context/auth-context", () => ({
  useAuth: () => ({ isAuthenticated: false, user: null, logout: vi.fn() }),
}));
beforeEach(() => {
  getConversationState().conversations.forEach((chat) =>
    deleteConversation(chat.id),
  );
  HTMLDialogElement.prototype.showModal = function (): void {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function (): void {
    this.open = false;
  };
});
afterEach(cleanup);
function Location(): React.ReactElement {
  const location = useLocation();
  return (
    <output>
      {location.pathname}
      {location.search}
    </output>
  );
}
function setup(): string {
  const id = createConversation("Mi envase de prueba");
  render(
    <MemoryRouter initialEntries={[`/assistant?c=${id}`]}>
      <WorkspaceShell language="es" onToggleLanguage={vi.fn()}>
        <Location />
      </WorkspaceShell>
    </MemoryRouter>,
  );
  return id;
}
it("shows the selected chat and preserves it on cancel or Escape", async () => {
  const id = setup();
  const user = userEvent.setup();
  const trigger = screen.getByRole("button", {
    name: "Eliminar conversación: Mi envase de prueba",
  });
  await user.click(trigger);
  const dialog = screen.getByRole("alertdialog");
  expect(within(dialog).getByText("Mi envase de prueba")).toBeTruthy();
  expect(document.activeElement).toBe(
    within(dialog).getByRole("button", { name: "Conservar chat" }),
  );
  await user.click(
    within(dialog).getByRole("button", { name: "Conservar chat" }),
  );
  expect(document.activeElement).toBe(trigger);
  await user.click(trigger);
  fireEvent(
    screen.getByRole("alertdialog"),
    new Event("cancel", { cancelable: true }),
  );
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(
    getConversationState().conversations.some((chat) => chat.id === id),
  ).toBe(true);
});
it("deletes only the selected chat and leaves its route after confirmation", async () => {
  const other = createConversation("Conservar este chat");
  const id = setup();
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", {
      name: "Eliminar conversación: Mi envase de prueba",
    }),
  );
  await user.click(screen.getByRole("button", { name: "Sí, eliminar" }));
  expect(
    getConversationState().conversations.some((chat) => chat.id === id),
  ).toBe(false);
  expect(
    getConversationState().conversations.some((chat) => chat.id === other),
  ).toBe(true);
  await waitFor(() => expect(screen.getByRole("status").textContent).toBe("/assistant"));
});
