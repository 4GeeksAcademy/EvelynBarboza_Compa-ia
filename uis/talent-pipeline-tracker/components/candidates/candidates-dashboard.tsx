"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CandidatesList } from "@/components/candidates/candidates-list";
import {
  CandidateForm,
  type CandidateFormValues,
} from "@/components/candidates/candidate-form";
import { CandidatesFilters } from "@/components/filters/candidates-filters";
import { createRecord, getRecords } from "@/services";
import type { CandidateRecord, CreateRecordPayload } from "@/types";

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

function getUniqueOptions(values: string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) =>
    left.localeCompare(right)
  );
}

function buildCandidatePayload(values: CandidateFormValues): CreateRecordPayload {
  const payload: CreateRecordPayload = {
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    position: values.position.trim(),
    status: values.status.trim(),
    stage: values.stage.trim(),
  };

  if (values.linkedin_url.trim()) {
    payload.linkedin_url = values.linkedin_url.trim();
  }

  if (values.cv_url.trim()) {
    payload.cv_url = values.cv_url.trim();
  }

  if (values.experience_years.trim()) {
    payload.experience_years = Number(values.experience_years);
  }

  if (values.applied_at.trim()) {
    payload.applied_at = new Date(values.applied_at).toISOString();
  }

  return payload;
}

export function CandidatesDashboard({
  initialRecords,
}: {
  initialRecords: CandidateRecord[];
}) {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<CandidateRecord[]>(initialRecords);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    return (searchParams.get("status") ?? "").trim();
  });
  const [stageFilter, setStageFilter] = useState(() => {
    return (searchParams.get("stage") ?? "").trim();
  });

  const statusOptions = useMemo(
    () => getUniqueOptions(records.map((record) => record.status)),
    [records]
  );
  const stageOptions = useMemo(
    () => getUniqueOptions(records.map((record) => record.stage)),
    [records]
  );

  const handleCreateCandidate = async (values: CandidateFormValues) => {
    await createRecord(buildCandidatePayload(values));

    const latestResponse = await getRecords<RecordsResponse>();
    const latestRecords = normalizeRecords(latestResponse);
    setRecords(latestRecords);
    setIsCreateFormOpen(false);
  };

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedStatus = statusFilter.trim().toLowerCase();
    const normalizedStage = stageFilter.trim().toLowerCase();

    return records.filter((record) => {
      const matchesStatus =
        normalizedStatus.length === 0 ||
        record.status.toLowerCase() === normalizedStatus;
      const matchesStage =
        normalizedStage.length === 0 || record.stage.toLowerCase() === normalizedStage;

      const candidateName = record.full_name.toLowerCase();
      const candidateEmail =
        typeof record.email === "string" ? record.email.toLowerCase() : "";
      const matchesQuery =
        normalizedQuery.length === 0 ||
        candidateName.includes(normalizedQuery) ||
        candidateEmail.includes(normalizedQuery);

      return matchesStatus && matchesStage && matchesQuery;
    });
  }, [records, searchQuery, statusFilter, stageFilter]);

  const updateFiltersInUrl = (nextStatus: string, nextStage: string) => {
    const params = new URLSearchParams(window.location.search);

    if (nextStatus.trim()) {
      params.set("status", nextStatus.trim());
    } else {
      params.delete("status");
    }

    if (nextStage.trim()) {
      params.set("stage", nextStage.trim());
    } else {
      params.delete("stage");
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
  };

  const handleStatusChange = (nextStatus: string) => {
    setStatusFilter(nextStatus);
    updateFiltersInUrl(nextStatus, stageFilter);
  };

  const handleStageChange = (nextStage: string) => {
    setStageFilter(nextStage);
    updateFiltersInUrl(statusFilter, nextStage);
  };

  return (
    <>
      <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        {!isCreateFormOpen ? (
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            onClick={() => {
              setIsCreateFormOpen(true);
            }}
          >
            Registrar Candidato
          </button>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-zinc-800">Registrar candidatura</h2>
            <div className="mt-4">
              <CandidateForm
                mode="create"
                onSubmit={handleCreateCandidate}
                secondaryButtonLabel="Cerrar"
                onSecondaryAction={() => {
                  setIsCreateFormOpen(false);
                }}
              />
            </div>
          </>
        )}
      </section>

      <CandidatesFilters
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        statusValue={statusFilter}
        onStatusChange={handleStatusChange}
        stageValue={stageFilter}
        onStageChange={handleStageChange}
        statusOptions={statusOptions}
        stageOptions={stageOptions}
      />

      <CandidatesList records={records} filteredRecords={filteredRecords} />
    </>
  );
}
