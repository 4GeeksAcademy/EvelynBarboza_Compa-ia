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

describe("talent pipeline auth client", () => {
  it("stores only non-empty talent tokens and logs out", () => {
    setToken("");
    expect(getToken()).toBeNull();
    setToken("talent-jwt");
    expect(getToken()).toBe("talent-jwt");
    logout();
    expect(getToken()).toBeNull();
    expect(window.location.replace).toHaveBeenCalledWith("/login");
    clearToken();
  });

  it("logs in and registers through the auth backend", async () => {
    fetchMock.mockResolvedValueOnce(response(200, { access_token: "jwt" }));
    await expect(login("a@b.com", "pw")).resolves.toBe("jwt");
    expect(getToken()).toBe("jwt");

    fetchMock.mockResolvedValueOnce(response(204));
    const payload = { email: "a@b.com", password: "pw", name: "Ana" };
    await expect(registerUser(payload)).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[1][1].body).toBe(JSON.stringify(payload));
  });

  it("gets user data and updates the profile with bearer auth", async () => {
    setToken("jwt");
    fetchMock.mockResolvedValueOnce(response(200, { id: "u1" }));
    await expect(getCurrentUser()).resolves.toEqual({ id: "u1" });

    const profile = { id: "p1", user_id: "u1", name: "Ana" };
    fetchMock.mockResolvedValueOnce(response(200, profile));
    await expect(updateMyProfile({ name: "Ana" })).resolves.toEqual(profile);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer jwt");
  });

  it("uses the generic error messages and exposes field errors", async () => {
    fetchMock.mockResolvedValueOnce(response(422, {
      detail: [{ loc: ["body", "email"], msg: "Correo inválido" }],
    }));
    await expect(login("bad", "pw")).rejects.toMatchObject({
      status: 422,
      message: "Revisa los campos indicados e inténtalo nuevamente.",
      fieldErrors: { email: "Correo inválido" },
    });

    fetchMock.mockResolvedValueOnce(response(500, { detail: "server" }));
    await expect(login("a", "b")).rejects.toMatchObject({
      status: 500,
      message: "No se pudo completar la solicitud. Revisa los datos e inténtalo nuevamente.",
    });
  });

  it("handles protected request failures and network errors", async () => {
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 401, message: "Sesion no iniciada." });
    expect(fetchMock).not.toHaveBeenCalled();

    setToken("jwt");
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 0 });

    fetchMock.mockResolvedValueOnce(response(401));
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 401, message: "Sesion expirada." });
    expect(getToken()).toBeNull();
    expect(window.location.replace).toHaveBeenCalledWith("/login");
    expect(new ApiError("x", 400).fieldErrors).toEqual({});
  });
});
