"use client";

import { useEffect, useState } from "react";

import {
  getIncidentSummary,
  getIncidents,
  INCIDENT_BRANCHES,
  INCIDENT_CATEGORIES,
  INCIDENT_ORIGINS,
  INCIDENT_STATUSES,
  IncidentApiError,
  updateIncidentStatus,
} from "@/lib/incidents";
import type {
  Incident,
  IncidentBranch,
  IncidentCategory,
  IncidentOrigin,
  IncidentStatus,
  IncidentSummary,
} from "@/lib/incidents";

import styles from "./incident-dashboard.module.css";


const ALLOWED_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["in_progress", "discarded"],
  in_progress: ["resolved", "discarded"],
  resolved: [],
  discarded: [],
};

const LABELS: Record<string, string> = {
  open: "Abierta",
  in_progress: "En curso",
  resolved: "Resuelta",
  discarded: "Descartada",
  customer: "Cliente",
  branch: "Sede",
  internal: "Interno",
  central: "Central",
  la_warehouse: "Los Ángeles · Almacén",
  la_office: "Los Ángeles · Oficina",
  zaragoza_warehouse: "Zaragoza · Almacén",
  zaragoza_office: "Zaragoza · Oficina",
  lost_parcel: "Paquete extraviado",
  delivery_failure: "Fallo de entrega",
  inventory_discrepancy: "Diferencia de inventario",
  carrier_issue: "Problema con carrier",
  returns_issue: "Devolución",
  warehouse_incident: "Incidente de almacén",
  system_failure: "Fallo de sistema",
  client_complaint: "Queja de cliente",
  other: "Otra",
};

function labelFor(value: string) {
  return LABELS[value] ?? value;
}

function SummaryGroup({
  title,
  values,
  placeholders,
  loading,
}: {
  title: string;
  values?: Record<string, number>;
  placeholders: readonly string[];
  loading: boolean;
}) {
  const entries = Object.entries(values ?? {});

  return (
    <section className={styles.summaryGroup} aria-label={title}>
      <h3>{title}</h3>
      <div className={styles.summaryBody}>
        <dl
          className={`${styles.summaryList} ${styles.summaryPlaceholder}`}
          aria-hidden="true"
          data-loading={loading}
        >
          {placeholders.map((key) => (
            <div key={key}>
              <dt><span>{labelFor(key)}</span></dt>
              <dd><span>000</span></dd>
            </div>
          ))}
        </dl>
        {values && (entries.length === 0 ? (
          <p className={styles.summaryEmpty}>Sin datos</p>
        ) : (
          <dl className={styles.summaryList}>
            {entries.map(([key, count]) => (
              <div key={key}>
                <dt>{labelFor(key)}</dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
    </section>
  );
}


export default function IncidentDashboard() {
  const [status, setStatus] = useState<"" | IncidentStatus>("");
  const [origin, setOrigin] = useState<"" | IncidentOrigin>("");
  const [branch, setBranch] = useState<"" | IncidentBranch>("");
  const [category, setCategory] = useState<"" | IncidentCategory>("");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listReload, setListReload] = useState(0);

  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [summaryReload, setSummaryReload] = useState(0);

  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [statusErrors, setStatusErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getIncidents({
      ...(status ? { status } : {}),
      ...(origin ? { origin } : {}),
      ...(branch ? { branch } : {}),
      ...(category ? { category } : {}),
    })
      .then((items) => {
        if (active) setIncidents(items);
      })
      .catch(() => {
        if (active) setError("No pudimos cargar las incidencias.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status, origin, branch, category, listReload]);

  useEffect(() => {
    let active = true;
    setSummaryLoading(true);
    setSummaryError("");

    getIncidentSummary()
      .then((result) => {
        if (active) setSummary(result);
      })
      .catch(() => {
        if (active) setSummaryError("No se pudo cargar el resumen.");
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [summaryReload]);

  async function changeStatus(incident: Incident, newStatus: IncidentStatus) {
    const previousStatus = incident.status;
    setIncidents((current) => current.map((item) => (
      item.id === incident.id ? { ...item, status: newStatus } : item
    )));
    setUpdatingIds((current) => new Set(current).add(incident.id));
    setStatusErrors((current) => ({ ...current, [incident.id]: "" }));

    try {
      const updated = await updateIncidentStatus(incident.id, newStatus);
      setIncidents((current) => current.map((item) => (
        item.id === incident.id ? updated : item
      )));
      setListReload((current) => current + 1);
      setSummaryReload((current) => current + 1);
    } catch (caught) {
      setIncidents((current) => current.map((item) => (
        item.id === incident.id ? { ...item, status: previousStatus } : item
      )));
      setStatusErrors((current) => ({
        ...current,
        [incident.id]: caught instanceof IncidentApiError
          ? caught.message
          : "No se pudo actualizar el estado.",
      }));
    } finally {
      setUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(incident.id);
        return next;
      });
    }
  }

  function resetFilters() {
    setStatus("");
    setOrigin("");
    setBranch("");
    setCategory("");
  }

  return (
    <div className={styles.dashboard}>
      <section
        className={styles.summarySection}
        aria-labelledby="incident-summary-title"
        aria-busy={summaryLoading}
      >
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="incident-summary-title">Resumen</h2>
            <p className={styles.summaryStatus} role={summaryLoading ? "status" : undefined}>
              {summaryLoading
                ? "Cargando resumen..."
                : summary ? `${summary.total} incidencias registradas` : "Resumen no disponible"}
            </p>
          </div>
          {summaryError && (
            <button
              className={styles.textButton}
              type="button"
              onClick={() => setSummaryReload((current) => current + 1)}
            >
              Reintentar resumen
            </button>
          )}
        </div>

        {summaryError && (
          <p className={styles.feedback} role="alert">{summaryError}</p>
        )}
        <div className={styles.summaryGroups}>
          <SummaryGroup title="Por estado" values={summary?.by_status} placeholders={INCIDENT_STATUSES} loading={summaryLoading && !summary} />
          <SummaryGroup title="Por categoría" values={summary?.by_category} placeholders={INCIDENT_CATEGORIES} loading={summaryLoading && !summary} />
          <SummaryGroup title="Por origen" values={summary?.by_origin} placeholders={INCIDENT_ORIGINS} loading={summaryLoading && !summary} />
          <SummaryGroup title="Por sede" values={summary?.by_branch} placeholders={INCIDENT_BRANCHES} loading={summaryLoading && !summary} />
        </div>
      </section>

      <section className={styles.listSection} aria-labelledby="incident-list-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="incident-list-title">Incidencias</h2>
            <p>Filtrá y actualizá el estado de cada registro.</p>
          </div>
          <button
            className={styles.textButton}
            type="button"
            onClick={() => setListReload((current) => current + 1)}
          >
            Actualizar lista
          </button>
        </div>

        <div className={styles.filters} aria-label="Filtros de incidencias">
          <label>
            Estado
            <select value={status} onChange={(event) => setStatus(event.target.value as "" | IncidentStatus)}>
              <option value="">Todos</option>
              {INCIDENT_STATUSES.map((value) => <option key={value} value={value}>{labelFor(value)}</option>)}
            </select>
          </label>
          <label>
            Origen
            <select value={origin} onChange={(event) => setOrigin(event.target.value as "" | IncidentOrigin)}>
              <option value="">Todos</option>
              {INCIDENT_ORIGINS.map((value) => <option key={value} value={value}>{labelFor(value)}</option>)}
            </select>
          </label>
          <label>
            Sede
            <select value={branch} onChange={(event) => setBranch(event.target.value as "" | IncidentBranch)}>
              <option value="">Todas</option>
              {INCIDENT_BRANCHES.map((value) => <option key={value} value={value}>{labelFor(value)}</option>)}
            </select>
          </label>
          <label>
            Categoría
            <select value={category} onChange={(event) => setCategory(event.target.value as "" | IncidentCategory)}>
              <option value="">Todas</option>
              {INCIDENT_CATEGORIES.map((value) => <option key={value} value={value}>{labelFor(value)}</option>)}
            </select>
          </label>
          <button className={styles.resetButton} type="button" onClick={resetFilters}>
            Limpiar filtros
          </button>
        </div>

        {loading ? (
          <p className={styles.feedback} role="status">Cargando incidencias...</p>
        ) : error ? (
          <div className={styles.loadError} role="alert">
            <p>No pudimos cargar las incidencias.</p>
            <button type="button" onClick={() => setListReload((current) => current + 1)}>
              Reintentar
            </button>
          </div>
        ) : incidents.length === 0 ? (
          <p className={styles.emptyState}>No hay incidencias para los filtros seleccionados.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Título</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Origen</th>
                  <th scope="col">Sede</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Actualizar estado</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => {
                  const transitions = ALLOWED_TRANSITIONS[incident.status];
                  const isUpdating = updatingIds.has(incident.id);

                  return (
                    <tr key={incident.id}>
                      <th className={styles.titleCell} scope="row">
                        <span>{incident.title}</span>
                        {statusErrors[incident.id] && (
                          <small className={styles.rowError} role="alert">
                            {statusErrors[incident.id]}
                          </small>
                        )}
                      </th>
                      <td>{labelFor(incident.category)}</td>
                      <td><span className={styles.status}>{labelFor(incident.status)}</span></td>
                      <td>{labelFor(incident.origin)}</td>
                      <td>{labelFor(incident.branch)}</td>
                      <td>{new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(incident.created_at))}</td>
                      <td>
                        <select
                          aria-label={`Cambiar estado de ${incident.title}`}
                          value={incident.status}
                          disabled={isUpdating || transitions.length === 0}
                          onChange={(event) => {
                            const nextStatus = event.target.value as IncidentStatus;
                            if (transitions.includes(nextStatus)) {
                              void changeStatus(incident, nextStatus);
                            }
                          }}
                        >
                          <option value={incident.status}>{labelFor(incident.status)}</option>
                          {transitions.map((nextStatus) => (
                            <option key={nextStatus} value={nextStatus}>{labelFor(nextStatus)}</option>
                          ))}
                        </select>
                        {isUpdating && <small className={styles.saving}>Guardando...</small>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}