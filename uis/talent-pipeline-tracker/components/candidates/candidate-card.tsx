import Link from "next/link";
import type { CandidateRecord } from "@/types";

interface CandidateCardProps {
  candidate: CandidateRecord;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nombre completo" value={candidate.full_name} />
        <Field label="Puesto" value={candidate.position} />
        <Field label="Estado" value={candidate.status} />
        <Field label="Etapa" value={candidate.stage} />
      </div>

      <div className="mt-4">
        <Link
          href={`/candidates/${encodeURIComponent(String(candidate.id))}`}
          className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Ver detalle
        </Link>
      </div>
    </article>
  );
}

interface FieldProps {
  label: string;
  value: string;
}

function Field({ label, value }: FieldProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-zinc-900">{value}</p>
    </div>
  );
}