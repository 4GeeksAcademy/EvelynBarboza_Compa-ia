import { CandidateDetailPanel } from "@/components/candidates/candidate-detail-panel";
import { getRecordById, getRecordNotes } from "@/services";
import type { CandidateRecord, RecordNote } from "@/types";

type NotesResponse =
  | RecordNote[]
  | { notes: RecordNote[] }
  | { data: RecordNote[] }
  | { results: RecordNote[] };

function normalizeNotes(response: NotesResponse): RecordNote[] {
  if (Array.isArray(response)) {
    return response;
  }

  if ("notes" in response && Array.isArray(response.notes)) {
    return response.notes;
  }

  if ("data" in response && Array.isArray(response.data)) {
    return response.data;
  }

  if ("results" in response && Array.isArray(response.results)) {
    return response.results;
  }

  return [];
}

interface CandidatePageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidatePage({ params }: CandidatePageProps) {
  const { id } = await params;
  const [candidate, notesResponse] = await Promise.all([
    getRecordById<CandidateRecord>(id),
    getRecordNotes<NotesResponse>(id),
  ]);
  const notes = normalizeNotes(notesResponse);

  return <CandidateDetailPanel initialCandidate={candidate} initialNotes={notes} />;
}
