"use client";

import { useWebsite } from "../lib/use-website";
import { translations } from "../lib/landing-copy";

export default function Landing() {
  const { language, changeLanguage, theme, setTheme, menuOpen, setMenuOpen } = useWebsite(translations);
  const t = translations[language];
  return <>

    <a href="#inicio" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-white" onClick={() => setMenuOpen(false)}>{t.skipToMain}</a>

    <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/90 backdrop-blur" role="banner">
      <nav className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6" aria-label="Navegación principal">
        <div className="flex items-center justify-between">
          <a href="#inicio" className="brand transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_8px_20px_rgba(6,182,212,0.35)]" aria-label="Ir al inicio" onClick={() => setMenuOpen(false)}>
            <span className="brandTrack">Track</span><span className="brandFlow">Flow</span><span className="brandDot">.</span>
          </a>

          <button type="button" className="themeToggle themeToggleMobile" data-theme-toggle="" aria-label={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"} title={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"} onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            <svg data-theme-moon="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={theme === "dark" ? "hidden" : ""}><path strokeLinecap="round" strokeLinejoin="round" d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" /></svg>
            <svg data-theme-sun="" className={theme === "light" ? "hidden" : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
          </button>
          <button id="mobile-menu-button" type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 text-primary transition-all duration-200 hover:scale-105 hover:bg-page focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden" aria-label={menuOpen ? t.closeMenu : t.openMenu} aria-controls="mobile-menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#inicio" className="rounded-lg px-2 py-1 text-sm font-medium text-ink/80 transition-all duration-200 hover:scale-105 hover:bg-secondary/10 hover:text-secondary" onClick={() => setMenuOpen(false)}>{t.navHome}</a>
            <a href="#como-funciona" className="rounded-lg px-2 py-1 text-sm font-medium text-ink/80 transition-all duration-200 hover:scale-105 hover:bg-secondary/10 hover:text-secondary" onClick={() => setMenuOpen(false)}>{t.navHowItWorks}</a>
            <a href="#experiencias" className="rounded-lg px-2 py-1 text-sm font-medium text-ink/80 transition-all duration-200 hover:scale-105 hover:bg-secondary/10 hover:text-secondary" onClick={() => setMenuOpen(false)}>{t.navExperiences}</a>
            <a href="#contacto" className="rounded-lg px-2 py-1 text-sm font-medium text-ink/80 transition-all duration-200 hover:scale-105 hover:bg-secondary/10 hover:text-secondary" onClick={() => setMenuOpen(false)}>{t.navContact}</a>
            <div className="inline-flex items-center rounded-xl border border-primary/20 bg-white p-1">
              <button type="button" data-lang-switch="es" className={"rounded-lg px-2 py-1 text-xs font-semibold  transition-all duration-200 hover:scale-105 hover:bg-secondary/10" + (language === "es" ? " text-primary bg-page" : " text-ink/70")} onClick={() => changeLanguage("es")}>ES</button>
              <button type="button" data-lang-switch="en" className={"rounded-lg px-2 py-1 text-xs font-semibold  transition-all duration-200 hover:scale-105 hover:bg-secondary/10" + (language === "en" ? " text-primary bg-page" : " text-ink/70")} onClick={() => changeLanguage("en")}>EN</button>
            </div>
            <button type="button" className="themeToggle themeToggleDesktop" data-theme-toggle="" aria-label={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"} title={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"} onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              <svg data-theme-moon="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={theme === "dark" ? "hidden" : ""}><path strokeLinecap="round" strokeLinejoin="round" d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" /></svg>
              <svg data-theme-sun="" className={theme === "light" ? "hidden" : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
            </button>
            <a href={`/application.html?lang=${language}`} className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" aria-label={t.navApplyAria} onClick={() => setMenuOpen(false)}>{t.navApply}</a>
          </div>
        </div>

        <div id="mobile-menu" className={"mt-4  rounded-2xl border border-primary/10 bg-white p-4 shadow-md md:" + (menuOpen ? "" : " hidden")}>
          <div className="flex flex-col gap-3">
            <a href="#inicio" className="rounded-xl px-3 py-2 text-sm font-medium text-ink/80 transition-all duration-200 hover:scale-105 hover:bg-secondary/10 hover:text-secondary" onClick={() => setMenuOpen(false)}>{t.navHome}</a>
            <a href="#como-funciona" className="rounded-xl px-3 py-2 text-sm font-medium text-ink/80 transition-all duration-200 hover:scale-105 hover:bg-secondary/10 hover:text-secondary" onClick={() => setMenuOpen(false)}>{t.navHowItWorks}</a>
            <a href="#experiencias" className="rounded-xl px-3 py-2 text-sm font-medium text-ink/80 transition-all duration-200 hover:scale-105 hover:bg-secondary/10 hover:text-secondary" onClick={() => setMenuOpen(false)}>{t.navExperiences}</a>
            <a href="#contacto" className="rounded-xl px-3 py-2 text-sm font-medium text-ink/80 transition-all duration-200 hover:scale-105 hover:bg-secondary/10 hover:text-secondary" onClick={() => setMenuOpen(false)}>{t.navContact}</a>
            <div className="inline-flex items-center rounded-xl border border-primary/20 bg-white p-1">
              <button type="button" data-lang-switch="es" className={"rounded-lg px-2 py-1 text-xs font-semibold  transition-all duration-200 hover:scale-105 hover:bg-secondary/10" + (language === "es" ? " text-primary bg-page" : " text-ink/70")} onClick={() => changeLanguage("es")}>ES</button>
              <button type="button" data-lang-switch="en" className={"rounded-lg px-2 py-1 text-xs font-semibold  transition-all duration-200 hover:scale-105 hover:bg-secondary/10" + (language === "en" ? " text-primary bg-page" : " text-ink/70")} onClick={() => changeLanguage("en")}>EN</button>
            </div>
            <a href={`/application.html?lang=${language}`} className="mt-1 rounded-2xl bg-primary px-5 py-3 text-center text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-secondary" aria-label={t.navApplyAria} onClick={() => setMenuOpen(false)}>{t.navApply}</a>
          </div>
        </div>
      </nav>
    </header>

    <main className="w-full" aria-label="Contenido principal">
      <section id="inicio" className="relative flex h-[100svh] items-center overflow-hidden border border-primary/40 bg-primary p-6 shadow-md sm:p-8 lg:p-10" aria-labelledby="hero-title">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="h-full w-full bg-cover bg-center opacity-45 blur-[1px]" style={{"backgroundImage": "url('https://media.istockphoto.com/id/1652511983/es/vector/gesti%C3%B3n-de-la-cadena-de-suministro-scm-ilustraci%C3%B3n-conceptual.jpg?s=612x612&w=0&k=20&c=kfSVewYYvec6r2s19OCX6sDQ4LGNzPjVtUUCpza2hBc=')"}}></div>
          <div className="absolute inset-0 bg-primary/40"></div>
        </div>
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl"></div>

        <div className="relative z-10 max-w-3xl">
          <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">{t.heroBadge}</p>
          <h1 id="hero-title" className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">{t.heroTitle}</h1>
          <p className="mt-4 text-base leading-relaxed text-white/90 sm:text-lg">{t.heroDescription}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={`/application.html?lang=${language}`} className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-semibold text-primary shadow-md transition-all duration-200 hover:scale-105 hover:bg-page focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" aria-label={t.heroPrimaryAria} onClick={() => setMenuOpen(false)}>{t.heroPrimary}</a>
            <a href="#como-funciona" className="rounded-2xl border border-white/40 bg-transparent px-5 py-3 text-center text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:border-accent hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" aria-label={t.heroSecondaryAria} onClick={() => setMenuOpen(false)}>{t.heroSecondary}</a>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="flex h-[100svh] items-center border border-primary/10 bg-white p-6 shadow-md sm:p-8 lg:p-10" aria-labelledby="como-funciona-title">
        <div className="w-full">
          <div className="mb-5">
          <h2 id="como-funciona-title" className="text-2xl font-bold text-primary sm:text-3xl">{t.howTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink/80 sm:text-base">{t.howDescription}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            <article className="flex h-full flex-col rounded-2xl border border-primary/40 bg-primary p-7 shadow-md transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(255,255,255,0.28)] lg:min-h-64 lg:p-8">
            <h3 className="text-base font-semibold text-white">{t.howCard1Title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-white/90">{t.howCard1Text}</p>
            </article>
            <article className="flex h-full flex-col rounded-2xl border border-primary/40 bg-primary p-7 shadow-md transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(255,255,255,0.28)] lg:min-h-64 lg:p-8">
            <h3 className="text-base font-semibold text-white">{t.howCard2Title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-white/90">{t.howCard2Text}</p>
            </article>
            <article className="flex h-full flex-col rounded-2xl border border-primary/40 bg-primary p-7 shadow-md transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(255,255,255,0.28)] lg:min-h-64 lg:p-8">
            <h3 className="text-base font-semibold text-white">{t.howCard3Title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-white/90">{t.howCard3Text}</p>
            </article>
            <article className="flex h-full flex-col rounded-2xl border border-primary/40 bg-primary p-7 shadow-md transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(255,255,255,0.28)] lg:min-h-64 lg:p-8">
            <h3 className="text-base font-semibold text-white">{t.howCard4Title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-white/90">{t.howCard4Text}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="experiencias" className="flex h-[100svh] items-center border border-primary/40 bg-primary p-6 shadow-md sm:p-8 lg:p-10" aria-labelledby="experiencias-title">
        <div className="w-full">
          <div className="mb-5">
          <h2 id="experiencias-title" className="text-2xl font-bold text-white sm:text-3xl">{t.expTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/90 sm:text-base">{t.expDescription}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white p-7 shadow-md transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(30,58,138,0.28)] lg:min-h-72 lg:p-8">
            <div className="pointer-events-none absolute inset-0 bg-cover opacity-30 blur-[1px]" style={{"backgroundImage": "url('https://thumbs.dreamstime.com/b/imagen-del-concepto-de-la-log%C3%ADstica-del-env%C3%ADo-del-transporte-46109326.jpg')", "backgroundRepeat": "no-repeat", "backgroundPosition": "15% center", "backgroundSize": "cover"}} aria-hidden="true"></div>
            <div className="pointer-events-none absolute inset-0 bg-primary/35" aria-hidden="true"></div>
            <div className="relative z-10 flex h-full flex-col">
            <h3 className="text-base font-semibold text-primary">{t.expCard1Title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/80">{t.expCard1Text}</p>
            </div>
            </article>
            <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white p-7 shadow-md transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(30,58,138,0.28)] lg:min-h-72 lg:p-8">
            <div className="pointer-events-none absolute inset-0 bg-cover opacity-30 blur-[1px]" style={{"backgroundImage": "url('https://thumbs.dreamstime.com/b/imagen-del-concepto-de-la-log%C3%ADstica-del-env%C3%ADo-del-transporte-46109326.jpg')", "backgroundRepeat": "no-repeat", "backgroundPosition": "50% center", "backgroundSize": "cover"}} aria-hidden="true"></div>
            <div className="pointer-events-none absolute inset-0 bg-primary/35" aria-hidden="true"></div>
            <div className="relative z-10 flex h-full flex-col">
            <h3 className="text-base font-semibold text-primary">{t.expCard2Title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/80">{t.expCard2Text}</p>
            </div>
            </article>
            <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white p-7 shadow-md transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(30,58,138,0.28)] lg:min-h-72 lg:p-8">
            <div className="pointer-events-none absolute inset-0 bg-cover opacity-30 blur-[1px]" style={{"backgroundImage": "url('https://thumbs.dreamstime.com/b/imagen-del-concepto-de-la-log%C3%ADstica-del-env%C3%ADo-del-transporte-46109326.jpg')", "backgroundRepeat": "no-repeat", "backgroundPosition": "85% center", "backgroundSize": "cover"}} aria-hidden="true"></div>
            <div className="pointer-events-none absolute inset-0 bg-primary/35" aria-hidden="true"></div>
            <div className="relative z-10 flex h-full flex-col">
            <h3 className="text-base font-semibold text-primary">{t.expCard3Title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/80">{t.expCard3Text}</p>
            </div>
            </article>
          </div>
        </div>
      </section>

      <section id="contacto" className="flex h-[100svh] items-center border border-primary/10 bg-white p-6 shadow-md sm:p-8 lg:p-10" aria-labelledby="contacto-title">
        <div className="relative w-full overflow-hidden rounded-2xl border border-primary/10 bg-white p-6 shadow-md transition-transform duration-300 ease-out hover:shadow-[0_18px_40px_rgba(30,58,138,0.22)] sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30 blur-[1px]" style={{"backgroundImage": "url('https://thumbs.dreamstime.com/b/personas-almac%C3%A9n-y-%C3%A1reas-superiores-para-log%C3%ADstica-cajas-e-inspecci%C3%B3n-embalaje-estanter%C3%ADas-control-de-seguridad-grupo-415186584.jpg')"}} aria-hidden="true"></div>
          <div className="relative z-10">
          <h2 id="contacto-title" className="text-2xl font-bold text-primary">{t.contactTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/80 sm:text-base">{t.contactDescription}</p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <article className="flex h-full flex-col rounded-2xl border border-primary/10 bg-page p-6 shadow-md transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(30,58,138,0.24)] lg:min-h-40">
            <h3 className="text-sm font-semibold text-primary">{t.contactCard1Title}</h3>
            <p className="mt-2 flex-1 text-sm text-ink/80">Los Angeles, CA</p>
            </article>
            <article className="flex h-full flex-col rounded-2xl border border-primary/10 bg-page p-6 shadow-md transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(30,58,138,0.24)] lg:min-h-40">
            <h3 className="text-sm font-semibold text-primary">{t.contactCard2Title}</h3>
            <p className="mt-2 flex-1 text-sm text-ink/80">Zaragoza, Aragón</p>
            </article>
            <article className="flex h-full flex-col rounded-2xl border border-primary/10 bg-page p-6 shadow-md transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(30,58,138,0.24)] sm:col-span-2 lg:col-span-1 lg:min-h-40">
            <h3 className="text-sm font-semibold text-primary">{t.contactCard3Title}</h3>
            <a href={`/application.html?lang=${language}`} className="mt-auto inline-block rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-all duration-200  hover:bg-secondary" aria-label={t.contactCtaAria} onClick={() => setMenuOpen(false)}>{t.contactCta}</a>
            </article>
          </div>
          </div>
        </div>
      </section>
    </main>

    <footer className="border-t border-primary/40 bg-primary" role="contentinfo">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-white/85 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
        <p>{t.footerLine1}</p>
        <p>{t.footerLine2}</p>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 pb-6 text-sm text-white/90 sm:px-6">
        <p>
          <span>{t.footerContactLabel}</span>
          <a className="font-semibold text-white hover:text-accent" href="mailto:trackflow@gmail.com" onClick={() => setMenuOpen(false)}>trackflow@gmail.com</a>
          <span className="mx-2 text-white/70">|</span>
          <a className="font-semibold text-white hover:text-accent" href="tel:+5491123456789" onClick={() => setMenuOpen(false)}>{t.footerPhone}</a>
        </p>
      </div>
    </footer>

  </>;
}
