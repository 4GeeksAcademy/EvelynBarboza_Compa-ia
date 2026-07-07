import { CandidatesDashboard } from "@/components/candidates/candidates-dashboard";
import { getRecords } from "@/services";
import type { CandidateRecord } from "@/types";

type RecordsResponse =
  | CandidateRecord[]
  | { records: CandidateRecord[] }
  | { data: CandidateRecord[] }
  | { results: CandidateRecord[] };

function normalizeRecords(response: RecordsResponse): CandidateRecord[] {
  if (Array.isArray(response)) {
    return response;
  }

  if ("records" in response && Array.isArray(response.records)) {
    return response.records;
  }

  if ("data" in response && Array.isArray(response.data)) {
    return response.data;
  }

  if ("results" in response && Array.isArray(response.results)) {
    return response.results;
  }

  return [];
}

export default async function Home() {
  const response = await getRecords<RecordsResponse>();
  const records = normalizeRecords(response);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Candidaturas</h1>
      </header>

      <CandidatesDashboard initialRecords={records} />
    </main>
  );
}
