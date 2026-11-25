import { getStoredTokens, getStoredUser, renewAccountTokens } from "./auth";
import type { Tokens } from "../types/auth.types";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const GUEST_KEY = "sortleaf_guest_session";
let acquiring: Promise<Tokens> | undefined;

export function hasChatSession(): boolean {
  return Boolean(getStoredTokens()?.access_token || localStorage.getItem(GUEST_KEY));
}

async function getGuest(): Promise<Tokens> {
  const raw = localStorage.getItem(GUEST_KEY);
  const current: Tokens | null = raw ? JSON.parse(raw) : null;
  if (current && (current.expires_at ?? 0) > Date.now() / 1000 + 60) return current;
  const response = await fetch(API_URL + (current ? "/auth/refresh" : "/auth/guest"), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: current ? JSON.stringify({ refresh_token: current.refresh_token }) : undefined,
    cache: "no-store",
  });
  if (!response.ok) {
    if (current && [401, 403].includes(response.status)) {
      localStorage.removeItem(GUEST_KEY);
      window.dispatchEvent(new Event("sortleaf-guest-ended"));
    }
    throw new Error("guest_session_unavailable");
  }
  const session: Tokens = await response.json();
  localStorage.setItem(GUEST_KEY, JSON.stringify(session));
  return session;
}

export async function chatHeaders(): Promise<Record<string, string>> {
  let account = getStoredTokens();
  const accountId = getStoredUser()?.id;
  if (account?.expires_at && account.expires_at <= Date.now() / 1000 + 30) account = await renewAccountTokens();
  if (!account && !acquiring) {
    const guest = navigator.locks ? navigator.locks.request(GUEST_KEY, getGuest) : getGuest();
    acquiring = Promise.resolve(guest).then(async session => await session).finally(() => { acquiring = undefined; });
  }
  const session = account ?? await acquiring;
  if (!session?.access_token || getStoredUser()?.id !== accountId) throw new Error("session_changed");
  return { Authorization: `Bearer ${session.access_token}`, "X-API-Key": import.meta.env.VITE_API_KEY || "" };
}
