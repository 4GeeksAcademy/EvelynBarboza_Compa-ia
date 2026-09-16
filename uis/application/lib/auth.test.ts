/// <reference types="jest" />

import {
  ApiError,
  changePassword,
  clearToken,
  forgotPassword,
  getCurrentUser,
  getToken,
  login,
  logout,
  registerUser,
  resetPassword,
  setToken,
  updateMyProfile,
} from "./auth";

const fetchMock = jest.fn();

type ResponseBody = unknown;

function response(status: number, body?: ResponseBody): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  localStorage.clear();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { replace: jest.fn() },
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("application auth client", () => {
  it("manages the browser token and logout navigation", () => {
    expect(getToken()).toBeNull();
    setToken("token");
    expect(getToken()).toBe("token");
    setToken("");
    expect(getToken()).toBeNull();

    setToken("token");
    logout();
    expect(getToken()).toBeNull();
    expect(window.location.replace).toHaveBeenCalledWith("/login");
    clearToken();
  });

  it("logs in with form data and stores the access token", async () => {
    fetchMock.mockResolvedValue(response(200, { access_token: "jwt" }));

    await expect(login("user@example.com", "secret")).resolves.toBe("jwt");
    expect(getToken()).toBe("jwt");
    expect(fetchMock).toHaveBeenCalledWith("/auth-backend/auth/login", expect.objectContaining({
      method: "POST",
      body: "username=user%40example.com&password=secret",
    }));
  });

  it("registers and sends profile updates", async () => {
    fetchMock.mockResolvedValueOnce(response(204));
    await expect(registerUser({ email: "a@b.com", password: "pw", name: "Ana" })).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe("/auth-backend/users");

    setToken("jwt");
    const profile = { id: "p1", user_id: "u1", name: "Ana", phone: null, address: null };
    fetchMock.mockResolvedValue(response(200, profile));
    await expect(updateMyProfile({ name: "Ana" })).resolves.toEqual(profile);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer jwt");
  });

  it("gets the current user and supports password flows", async () => {
    setToken("jwt");
    fetchMock
      .mockResolvedValueOnce(response(200, { id: "u1" }))
      .mockResolvedValueOnce(response(204))
      .mockResolvedValueOnce(response(204))
      .mockResolvedValueOnce(response(204));

    await expect(getCurrentUser()).resolves.toEqual({ id: "u1" });
    await expect(forgotPassword("a@b.com")).resolves.toBeUndefined();
    await expect(resetPassword("reset", "new")).resolves.toBeUndefined();
    await expect(changePassword("old", "new")).resolves.toBeUndefined();

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/auth-backend/auth/me",
      "/auth-backend/auth/forgot-password",
      "/auth-backend/auth/reset-password",
      "/auth-backend/auth/change-password",
    ]);
  });

  it("rejects protected calls without a token", async () => {
    await expect(getCurrentUser()).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Sesion no iniciada.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(window.location.replace).toHaveBeenCalledWith("/login");
  });

  it("handles network failures, expired sessions and validation errors", async () => {
    setToken("jwt");
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 0 });

    fetchMock.mockResolvedValueOnce(response(401, { detail: "expired" }));
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 401, message: "Sesion expirada." });
    expect(getToken()).toBeNull();

    fetchMock.mockResolvedValueOnce(response(422, {
      detail: [
        { loc: ["body", "email"], msg: "Correo inválido" },
        { loc: ["body", "password"], msg: "Requerida" },
        null,
      ],
    }));
    await expect(login("bad", "")).rejects.toEqual(expect.objectContaining({
      status: 422,
      message: "Revisa los campos indicados e inténtalo nuevamente.",
      fieldErrors: { email: "Correo inválido", password: "Requerida" },
    } satisfies Partial<ApiError>));

    fetchMock.mockResolvedValueOnce(response(500, { detail: "server" }));
    await expect(login("a", "b")).rejects.toMatchObject({
      status: 500,
      message: "No se pudo completar la solicitud. Revisa los datos e inténtalo nuevamente.",
    });
  });
});
