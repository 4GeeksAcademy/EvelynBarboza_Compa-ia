"use client";

import { useEffect, useState } from "react";

export type Language = "es" | "en";

const THEME_STORAGE_KEY = "trackflow-theme";

export function useWebsite(copy: Record<Language, { title: string }>) {
  const [language, setLanguage] = useState<Language>("es");
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("lang");
    let initial: string | null = query;
    try {
      if (query !== "es" && query !== "en") {
        initial = window.localStorage.getItem("trackflow-lang");
      }
      if (initial === "es" || initial === "en") {
        setLanguage(initial);
        window.localStorage.setItem("trackflow-lang", initial);
      }
    } catch (error) {
      console.warn("No se pudo acceder a la preferencia de idioma.", error);
      if (initial === "es" || initial === "en") setLanguage(initial);
    }

    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeState(savedTheme);
        document.documentElement.dataset.theme = savedTheme;
      }
    } catch (error) {
      console.warn("No se pudo acceder a la preferencia de tema.", error);
    }
  }, []);

  useEffect(() => {
    const dictionary = copy[language];
    document.documentElement.lang = language;
    document.title = dictionary.title;
    const description = "metaDescription" in dictionary
      ? dictionary.metaDescription
      : "description" in dictionary ? dictionary.description : null;
    if (typeof description === "string") {
      document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    }
  }, [copy, language]);

  function changeTheme(next: "light" | "dark") {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (error) {
      console.warn("No se pudo guardar la preferencia de tema.", error);
    }
  }

  function changeLanguage(next: Language) {
    setLanguage(next);
    try {
      window.localStorage.setItem("trackflow-lang", next);
    } catch (error) {
      console.warn("No se pudo guardar la preferencia de idioma.", error);
    }
  }

  return { language, changeLanguage, theme, setTheme: changeTheme, menuOpen, setMenuOpen };
}
