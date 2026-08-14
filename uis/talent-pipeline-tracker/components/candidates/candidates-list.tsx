"use client";

import { CandidateCard } from "@/components/candidates/candidate-card";
import type { CandidateRecord } from "@/types";

interface CandidatesListProps {
  records: CandidateRecord[];
  filteredRecords: CandidateRecord[];
}

export function CandidatesList({
  records,
  filteredRecords,
}: CandidatesListProps) {

  if (records.length === 0) {
    return (
      <article className="rounded-xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-600">No hay candidaturas disponibles.</p>
      </article>
    );
  }

  if (filteredRecords.length === 0) {
    return (
      <article className="rounded-xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-600">
          No hay resultados para los filtros seleccionados.
        </p>
      </article>
    );
  }

  return (
    <section className="grid gap-4">
      {filteredRecords.map((candidate) => (
        <CandidateCard key={String(candidate.id)} candidate={candidate} />
      ))}
    </section>
  );
}
