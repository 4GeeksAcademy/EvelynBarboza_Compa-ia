"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  getCurrentUser,
  getGuestTheme,
  getToken,
  setGuestTheme,
  updateThemePreference,
  type ThemeMode,
} from "@/lib/auth";

type ThemeContextValue = {
  theme: ThemeMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const AUTH_CHANGE_EVENT = "trackflow-auth-change";

function getUserId(token: string | null): string | null {
  if (!token || typeof window === "undefined") return null;

  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const claims = JSON.parse(window.atob(paddedPayload)) as { sub?: unknown };
    return typeof claims.sub === "string" ? claims.sub : null;
  } catch {
    return null;
  }
}

function getCachedTheme(userId: string | null): ThemeMode | null {
  if (!userId || typeof window === "undefined") return null;

  const cached = window.localStorage.getItem(`trackflow:theme:${userId}`);
  return cached === "dark" || cached === "light" ? cached : null;
}

function cacheTheme(userId: string, theme: ThemeMode): void {
  window.localStorage.setItem(`trackflow:theme:${userId}`, theme);
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const userId = getUserId(getToken());
  return (userId ? getCachedTheme(userId) : getGuestTheme()) ?? "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const currentUserId = useRef<string | null>(null);
  const localChangeVersion = useRef(0);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let active = true;

    async function syncTheme() {
      const token = getToken();
      const userId = getUserId(token);

      if (!userId) {
        currentUserId.current = null;
        localChangeVersion.current = 0;
        setTheme(getGuestTheme() ?? "light");
        return;
      }

      if (currentUserId.current !== userId) {
        currentUserId.current = userId;
        localChangeVersion.current = 0;
      }

      const cached = getCachedTheme(userId);
      if (cached) setTheme(cached);
      const versionAtRequest = localChangeVersion.current;

      try {
        const user = await getCurrentUser();
        if (
          !active
          || getUserId(getToken()) !== userId
          || localChangeVersion.current !== versionAtRequest
        ) return;

        setTheme(user.theme);
        cacheTheme(userId, user.theme);
      } catch {
        // Keep the user-scoped cached value when the API is temporarily unavailable.
      }
    }

    void syncTheme();
    window.addEventListener(AUTH_CHANGE_EVENT, syncTheme);

    return () => {
      active = false;
      window.removeEventListener(AUTH_CHANGE_EVENT, syncTheme);
    };
  }, []);

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    const userId = getUserId(getToken());

    setTheme(nextTheme);
    if (!userId) {
      setGuestTheme(nextTheme);
      return;
    }

    currentUserId.current = userId;
    localChangeVersion.current += 1;
    cacheTheme(userId, nextTheme);
    void updateThemePreference(nextTheme).catch(() => {});
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggleButton() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("ThemeToggleButton requires ThemeProvider");

  const { theme, toggleTheme } = context;
  const label = theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro";

  return (
    <button
      type="button"
      className="themeToggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {theme === "light" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      )}
    </button>
  );
}
