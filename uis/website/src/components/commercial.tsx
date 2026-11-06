"use client";

import { useWebsite } from "../lib/use-website";
import { useCommercialForm } from "../lib/use-commercial-form";
import { translations } from "../lib/commercial-copy";

export default function Commercial() {
  const { language, changeLanguage, theme, setTheme } = useWebsite(translations);
  const t = translations[language];
  const { fields, errors, notice, submitting, formRef, alertRef, text, updateField, submitForm, clearForm } = useCommercialForm(language);
  return <>

    <a href="#formulario" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-white">Saltar al formulario</a>

    <header className="border-b border-primary/10 bg-white/80 backdrop-blur" role="banner">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <a href={`/index.html?lang=${language}`} className="brand transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_8px_20px_rgba(6,182,212,0.35)]" aria-label="Ir a la página principal">
          <span className="brandTrack">Track</span><span className="brandFlow">Flow</span><span className="brandDot">.</span>
        </a>
        <div className="flex items-center gap-2">
          <button type="button" className="themeToggle" data-theme-toggle="" aria-label={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"} title={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"} onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            <svg data-theme-moon="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={theme === "dark" ? "hidden" : ""}><path strokeLinecap="round" strokeLinejoin="round" d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" /></svg>
            <svg data-theme-sun="" className={theme === "light" ? "hidden" : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
          </button>
          <div className="inline-flex items-center rounded-xl border border-primary/20 bg-white p-1">
            <button type="button" data-lang-switch="es" className={"rounded-lg px-2 py-1 text-xs font-semibold  transition-all duration-200 hover:scale-105 hover:bg-secondary/10" + (language === "es" ? " text-primary bg-page" : " text-ink/70")} onClick={() => changeLanguage("es")}>ES</button>
            <button type="button" data-lang-switch="en" className={"rounded-lg px-2 py-1 text-xs font-semibold  transition-all duration-200 hover:scale-105 hover:bg-secondary/10" + (language === "en" ? " text-primary bg-page" : " text-ink/70")} onClick={() => changeLanguage("en")}>EN</button>
          </div>
          <a href={`/index.html?lang=${language}`} className="rounded-xl border border-primary/20 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-105 hover:border-secondary/50 hover:bg-secondary/10 hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" aria-label={t.backAria}>{t.back}</a>
        </div>
      </div>
    </header>

    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 md:max-w-4xl lg:py-14" aria-label="Formulario de registro">
      <section id="formulario" className="relative overflow-hidden rounded-2xl border border-primary/10 bg-white p-6 shadow-md sm:p-8 md:p-10">
        <div className="pointer-events-none absolute -top-28 -right-24 h-64 w-64 rounded-full bg-secondary/20 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"></div>

        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-semibold text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 0 1.5 1.5h4.5a1.5 1.5 0 0 0 1.5-1.5V9.36a1.5 1.5 0 0 0-.44-1.06l-3.86-3.86a1.5 1.5 0 0 0-1.06-.44H9.75a1.5 1.5 0 0 0-1.5 1.5v13.25Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v4.5m0 0v4.5m0-4.5h4.5m-4.5 0H7.5" />
            </svg>
            <span>{t.badge}</span>
          </div>
          <h1 className="text-2xl font-bold text-primary sm:text-3xl lg:text-4xl">{t.titleForm}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/80 sm:text-base">{t.subtitle}</p>
        </div>

        <div className="relative mt-6 grid gap-3 rounded-2xl border border-accent/20 bg-page p-4 text-sm text-ink/80 sm:grid-cols-2 sm:gap-4">
          <p className="inline-flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-secondary" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5h18M3 12h18m-9 4.5h9" />
            </svg>
                  <span>{t.highlight1}</span>
          </p>
          <p className="inline-flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-secondary" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6.75h2.25A2.25 2.25 0 0 1 21 9v8.25a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V9a2.25 2.25 0 0 1 2.25-2.25H7.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75h6M9 12h6m-6 4.5h3" />
            </svg>
            <span>{t.highlight2}</span>
          </p>
        </div>

        <div id="form-alert" className={"mt-6 rounded-xl border p-3 text-sm text-ink " + (!notice ? "hidden" : notice.error ? "border-ember/40 bg-ember/10" : "border-secondary/40 bg-secondary/10")} role="alert" aria-live="assertive" aria-atomic="true" tabIndex={-1} ref={alertRef}>{notice ? text[notice.key] : null}</div>

        <form id="application-form" noValidate className="mt-6 space-y-8" aria-describedby="form-help" onSubmit={submitForm} ref={formRef} aria-busy={submitting}>
            <p id="form-help" className="text-xs text-ink/70">{t.formHelp}</p>

          <div className="grid gap-8 lg:grid-cols-2">
            <fieldset className="rounded-2xl border border-primary/10 bg-page p-6 shadow-md transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(30,58,138,0.26)]">
              <legend className="inline-flex items-center gap-2 px-1 text-base font-semibold text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-accent" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75h3a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18V9a2.25 2.25 0 0 1 2.25-2.25h3" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6h6m-6 4.5h6m-6 4.5h3" />
                </svg>
                <span>{t.accessData}</span>
              </legend>
              <div className="mt-4 space-y-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold"><span>{t.fullNameLabel}</span> <span className="text-secondary">*</span></label>
                  <p id="fullName-desc" className="mt-1 text-xs text-ink/70">{t.fullNameDesc}</p>
                  <input id="fullName" name="fullName" type="text" autoComplete="name" inputMode="text" pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$" minLength={5} maxLength={200} title="Usa solo letras, espacios, apostrofes o guiones." required aria-required="true" aria-describedby="fullName-desc fullName-error" className="mt-2 w-full rounded-2xl border border-primary/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-accent/30" value={fields.fullName} onChange={(event) => updateField("fullName", event.target.value)} aria-invalid={Boolean(errors.fullName)} />
                  <p id="fullName-error" className="mt-2 text-sm text-red-700" role="alert" aria-live="polite">{errors.fullName ? text[errors.fullName] : null}</p>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold"><span>{t.emailLabel}</span> <span className="text-secondary">*</span></label>
                      <p id="email-desc" className="mt-1 text-xs text-ink/70">{t.emailDesc}</p>
                  <input id="email" name="email" type="email" maxLength={254} autoComplete="email" required aria-required="true" aria-describedby="email-desc email-error" className="mt-2 w-full rounded-2xl border border-primary/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-accent/30" value={fields.email} onChange={(event) => updateField("email", event.target.value)} aria-invalid={Boolean(errors.email)} />
                  <p id="email-error" className="mt-2 text-sm text-red-700" role="alert" aria-live="polite">{errors.email ? text[errors.email] : null}</p>
                </div>

              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-primary/10 bg-page p-6 shadow-md transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(30,58,138,0.26)]">
              <legend className="inline-flex items-center gap-2 px-1 text-base font-semibold text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-accent" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5A2.25 2.25 0 0 1 18.75 19.5H5.25A2.25 2.25 0 0 1 3 17.25V6.75Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 7.5 8.25 5.25 8.25-5.25" />
                </svg>
                <span>{t.optionalData}</span>
              </legend>
              <div className="mt-4 space-y-5">
                <div>
                        <label htmlFor="phone" className="block text-sm font-semibold">{t.phoneLabel}</label>
                      <p id="phone-desc" className="mt-1 text-xs text-ink/70">{t.phoneDesc}</p>
                  <input id="phone" maxLength={50} name="phone" type="tel" autoComplete="tel" inputMode="tel" aria-describedby="phone-desc" className="mt-2 w-full rounded-2xl border border-primary/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-accent/30" placeholder={t.phonePlaceholder} value={fields.phone} onChange={(event) => updateField("phone", event.target.value)} />
                </div>

                <div>
                        <label htmlFor="address" className="block text-sm font-semibold">{t.addressLabel}</label>
                      <p id="address-desc" className="mt-1 text-xs text-ink/70">{t.addressDesc}</p>
                  <input id="address" maxLength={500} name="address" type="text" autoComplete="street-address" aria-describedby="address-desc" className="mt-2 w-full rounded-2xl border border-primary/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-accent/30" placeholder={t.addressPlaceholder} value={fields.address} onChange={(event) => updateField("address", event.target.value)} />
                </div>

                <div>
                    <label htmlFor="inquiry" className="block text-sm font-semibold">{t.inquiryLabel}</label>
                    <p id="inquiry-desc" className="mt-1 text-xs text-ink/70">{t.inquiryDesc}</p>
                  <textarea id="inquiry" maxLength={5000} name="inquiry" rows={5} aria-describedby="inquiry-desc" className="mt-2 w-full resize-y rounded-2xl border border-primary/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-accent/30" placeholder={t.inquiryPlaceholder} value={fields.inquiry} onChange={(event) => updateField("inquiry", event.target.value)}></textarea>
                </div>
              </div>
            </fieldset>
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <button type="submit" className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto" aria-label={t.submitAria} disabled={submitting}>{t.submit}</button>
            <button type="button" id="clear-form" className="w-full rounded-2xl border border-primary/30 bg-white px-5 py-3 text-sm font-semibold text-primary transition-all duration-200 hover:scale-105 hover:border-accent hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto" aria-label={t.clearAria} disabled={submitting} onClick={clearForm}>{t.clear}</button>
          </div>
        </form>
      </section>
    </main>

    <footer className="border-t border-primary/10 bg-white commercial-footer" role="contentinfo">
      <div className="mx-auto w-full max-w-3xl px-4 py-5 text-xs text-ink/70 sm:px-6">
        <span>{t.footer}</span>
      </div>
    </footer>

  </>;
}
