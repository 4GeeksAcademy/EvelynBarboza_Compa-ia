/// <reference types="jest" />

import {
  ApiError,
  getToken,
  setToken,
  clearToken,
  logout,
  login,
  registerUser,
  getCurrentUser,
  updateMyProfile,
  updateThemePreference,
} from "./auth";

const fetchMock = jest.fn();
const response = (status: number, body?: unknown) => ({
  status,
  ok: status >= 200 && status < 300,
  json: jest.fn().mockResolvedValue(body),
}) as unknown as Response;

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  localStorage.clear();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { replace: jest.fn() },
  });
});

describe("backoffice auth client", () => {
  it("uses its own token key and redirects on logout", () => {
    setToken("backoffice-jwt");
    expect(getToken()).toBe("backoffice-jwt");
    logout();
    expect(getToken()).toBeNull();
    expect(window.location.replace).toHaveBeenCalledWith("/login");
    clearToken();
  });

  it("supports public and authenticated requests", async () => {
    fetchMock.mockResolvedValueOnce(response(200, { access_token: "jwt" }));
    await expect(login("a@b.com", "pw")).resolves.toBe("jwt");
    expect(getToken()).toBe("jwt");
    expect(fetchMock.mock.calls[0][1].body).toBe("username=a%40b.com&password=pw");

    fetchMock.mockResolvedValueOnce(response(204));
    await expect(registerUser({ email: "a@b.com", password: "pw", name: "Ana", phone: "123" })).resolves.toBeUndefined();

    fetchMock.mockResolvedValueOnce(response(200, { id: "u1" }));
    await expect(getCurrentUser()).resolves.toEqual({ id: "u1" });
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe("Bearer jwt");

    const profile = { id: "p1", user_id: "u1", name: "Ana" };
    fetchMock.mockResolvedValueOnce(response(200, profile));
    await expect(updateMyProfile({ name: "Ana", phone: "123" })).resolves.toEqual(profile);
  });

  it("caches the account theme from the login response before auth sync", async () => {
    const payload = window.btoa(JSON.stringify({ sub: "user-theme" }))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    fetchMock.mockResolvedValueOnce(response(200, {
      access_token: `header.${payload}.signature`,
      theme: "dark",
    }));

    await login("user@example.com", "secret");

    expect(localStorage.getItem("trackflow:theme:user-theme")).toBe("dark");
  });

  it("shows a clear message when the account email already exists", async () => {
    fetchMock.mockResolvedValueOnce(response(400, {
      detail: "Ya existe una cuenta registrada con ese email. Inicia sesión o utiliza otro email.",
    }));

    await expect(registerUser({
      email: "a@b.com",
      password: "pw",
      name: "Ana",
      phone: "123",
    })).rejects.toMatchObject({
      message: "Ya existe una cuenta registrada con ese email. Inicia sesión o utiliza otro email.",
    });
  });

  it("saves the selected theme for the authenticated account", async () => {
    setToken("jwt");
    fetchMock.mockResolvedValueOnce(response(200, { theme: "dark" }));

    await expect(updateThemePreference("dark")).resolves.toBeUndefined();

    expect(fetchMock.mock.calls[0][0]).toBe("/auth-backend/auth/me/preferences");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ theme: "dark" }),
    });
  });

  it("reports string and field validation errors as implemented", async () => {
    fetchMock.mockResolvedValueOnce(response(400, { detail: "No autorizado" }));
    await expect(login("a", "b")).rejects.toMatchObject({
      name: "ApiError", status: 400, message: "No autorizado", fieldErrors: {},
    });

    fetchMock.mockResolvedValueOnce(response(422, {
      detail: [
        { loc: ["body", "email"], msg: "Correo" },
        { loc: ["body", "password"], msg: "Clave" },
      ],
    }));
    await expect(login("a", "b")).rejects.toMatchObject({
      status: 422, message: "Correo | Clave",
      fieldErrors: { email: "Correo", password: "Clave" },
    });
  });

  it("handles missing tokens, connection errors and expired sessions", async () => {
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 401, message: "Sesion no iniciada." });
    expect(fetchMock).not.toHaveBeenCalled();

    setToken("jwt");
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 0 });

    fetchMock.mockResolvedValueOnce(response(401));
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 401, message: "Sesion expirada." });
    expect(getToken()).toBeNull();
    expect(window.location.replace).toHaveBeenCalledWith("/login");
    expect(new ApiError("x", 400).name).toBe("ApiError");
  });
});
