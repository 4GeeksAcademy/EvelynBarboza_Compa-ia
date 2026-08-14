export default function CandidateLoading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Detalle de candidatura</h1>
      </header>
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-600">Cargando candidatura...</p>
      </section>
    </main>
  );
}
