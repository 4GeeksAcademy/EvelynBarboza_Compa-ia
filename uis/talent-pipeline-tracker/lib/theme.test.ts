/// <reference types="jest" />

import {
  GUEST_THEME_KEY,
  THEME_INIT_SCRIPT,
  getToken,
  login,
  setGuestTheme,
  setToken,
} from "./auth";

const fetchMock = jest.fn();
const response = (status: number, body?: unknown) => ({
  status,
  ok: status >= 200 && status < 300,
  json: jest.fn().mockResolvedValue(body),
}) as unknown as Response;

function tokenFor(sub: string): string {
  const payload = window.btoa(JSON.stringify({ sub }))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `header.${payload}.signature`;
}

function runInitScript(): void {
  new Function(THEME_INIT_SCRIPT)();
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("theme continuity across login", () => {
  it("saves the theme chosen before login to the account", async () => {
    const token = tokenFor("user-1");
    setGuestTheme("dark");
    fetchMock
      .mockResolvedValueOnce(response(200, { access_token: token, theme: "light" }))
      .mockResolvedValueOnce(response(200, { theme: "dark" }));

    await login("a@b.com", "pw");

    expect(fetchMock.mock.calls[1][0]).toBe("/auth-backend/auth/me/preferences");
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ theme: "dark" }),
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(localStorage.getItem("trackflow:theme:user-1")).toBe("dark");
    expect(localStorage.getItem(GUEST_THEME_KEY)).toBeNull();
    expect(getToken()).toBe(token);
  });

  it("keeps the account theme when nothing was chosen before login", async () => {
    fetchMock.mockResolvedValueOnce(response(200, { access_token: tokenFor("user-1"), theme: "dark" }));

    await login("a@b.com", "pw");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("trackflow:theme:user-1")).toBe("dark");
  });

  it("keeps the account theme when the guest choice cannot be saved", async () => {
    setGuestTheme("dark");
    fetchMock
      .mockResolvedValueOnce(response(200, { access_token: tokenFor("user-1"), theme: "light" }))
      .mockResolvedValueOnce(response(500, {}));

    await login("a@b.com", "pw");

    expect(localStorage.getItem("trackflow:theme:user-1")).toBe("light");
    expect(localStorage.getItem(GUEST_THEME_KEY)).toBeNull();
  });

  it("keeps the guest choice when login fails", async () => {
    setGuestTheme("dark");
    fetchMock.mockResolvedValueOnce(response(401, { detail: "Credenciales invalidas" }));

    await expect(login("a@b.com", "bad")).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem(GUEST_THEME_KEY)).toBe("dark");
  });
});

describe("theme init script", () => {
  it("applies the guest theme without a session", () => {
    setGuestTheme("dark");
    runInitScript();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("applies the signed-in user's theme instead of the guest theme", () => {
    setGuestTheme("dark");
    setToken(tokenFor("user-2"), "light");
    runInitScript();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("ignores malformed tokens", () => {
    setToken("not-a-jwt");
    expect(runInitScript).not.toThrow();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});
