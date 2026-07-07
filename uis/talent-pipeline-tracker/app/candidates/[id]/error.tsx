"use client";

interface CandidateErrorProps {
  error: Error;
  reset: () => void;
}

export default function CandidateError({ error, reset }: CandidateErrorProps) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Detalle de candidatura</h1>
      </header>
      <section className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-700">Error al cargar candidatura</p>
        <p className="mt-2 text-sm text-red-600">{error.message}</p>
        <button
          type="button"
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          onClick={reset}
        >
          Reintentar
        </button>
      </section>
    </main>
  );
}
