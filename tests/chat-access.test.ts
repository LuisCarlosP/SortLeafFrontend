import { afterEach, expect, it, vi } from "vitest";
import { chatHeaders } from "../src/services/chat-access";
import { getHistory } from "../src/services/history";
import { storeTokens } from "../src/services/auth";

afterEach(() => { localStorage.clear(); vi.unstubAllGlobals(); });

it("opens one anonymous session for concurrent chat requests", async () => {
  const token = { access_token: "guest", refresh_token: "refresh", expires_at: Date.now() / 1000 + 3600 };
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(token)));
  vi.stubGlobal("fetch", fetcher);
  const [a,b] = await Promise.all([chatHeaders(), chatHeaders()]);
  expect(a.Authorization).toBe("Bearer guest");
  expect(b.Authorization).toBe(a.Authorization);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect((await chatHeaders()).Authorization).toBe(a.Authorization);
  await expect(getHistory()).rejects.toThrow("account_required");
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("uses the account session without creating a guest", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  storeTokens({access_token:"member", refresh_token:"r",token_type:"bearer",expires_in:3600});
  expect((await chatHeaders()).Authorization).toBe("Bearer member");
  expect(fetcher).not.toHaveBeenCalled();
});

it.each([[503, "guest"], [429, "rate"]])("can retry after a guest request returns %i", async (status, code) => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response(null, { status: Number(status) }))
    .mockResolvedValueOnce(Response.json({ access_token: "guest", refresh_token: "refresh" }));
  vi.stubGlobal("fetch", fetcher);
  await expect(chatHeaders()).rejects.toMatchObject({ code });
  expect((await chatHeaders()).Authorization).toBe("Bearer guest");
  expect(fetcher).toHaveBeenCalledTimes(2);
});
