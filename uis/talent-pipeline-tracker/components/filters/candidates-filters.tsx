"use client";

import { useMemo } from "react";

interface CandidatesFiltersProps {
  statusOptions: string[];
  stageOptions: string[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  stageValue: string;
  onStageChange: (value: string) => void;
}

export function CandidatesFilters({
  statusOptions,
  stageOptions,
  searchQuery,
  onSearchQueryChange,
  statusValue,
  onStatusChange,
  stageValue,
  onStageChange,
}: CandidatesFiltersProps) {
  const normalizedStatusOptions = useMemo(
    () => statusOptions.filter((option) => option.trim().length > 0),
    [statusOptions]
  );

  const normalizedStageOptions = useMemo(
    () => stageOptions.filter((option) => option.trim().length > 0),
    [stageOptions]
  );

  return (
    <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="search"
            className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Buscar por nombre o email
          </label>
          <input
            id="search"
            type="search"
            value={searchQuery}
            onChange={(event) => {
              onSearchQueryChange(event.target.value);
            }}
            placeholder="Ej. Ana o ana@email.com"
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label
            htmlFor="status"
            className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Estado
          </label>
          <select
            id="status"
            value={statusValue}
            onChange={(event) => {
              onStatusChange(event.target.value);
            }}
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
          >
            <option value="">Todos</option>
            {normalizedStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="stage"
            className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Etapa
          </label>
          <select
            id="stage"
            value={stageValue}
            onChange={(event) => {
              onStageChange(event.target.value);
            }}
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
          >
            <option value="">Todas</option>
            {normalizedStageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
