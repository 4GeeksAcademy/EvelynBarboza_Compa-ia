"use client";

import { useEffect, useState } from "react";

export type Language = "es" | "en";

export function useWebsite(copy: Record<Language, { title: string }>) {
  const [language, setLanguage] = useState<Language>("es");
  const [theme, setTheme] = useState<"light" | "dark">("light");
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function changeLanguage(next: Language) {
    setLanguage(next);
    try {
      window.localStorage.setItem("trackflow-lang", next);
    } catch (error) {
      console.warn("No se pudo guardar la preferencia de idioma.", error);
    }
  }

  return { language, changeLanguage, theme, setTheme, menuOpen, setMenuOpen };
}
