"use client";


import { useEffect, useMemo, useState } from "react";

import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplierRate,
  updateSupplierStatus,
} from "@/services/suppliers.service";
import type {
  Supplier,
  SupplierCategory,
  SupplierCountry,
  SupplierCreatePayload,
  SupplierCurrency,
  SupplierStatus,
} from "@/types/suppliers";


const COUNTRIES: SupplierCountry[] = [
  "USA",
  "Spain",
];


const CURRENCIES: SupplierCurrency[] = [
  "USD",
  "EUR",
];


const STATUSES: SupplierStatus[] = [
  "active",
  "suspended",
];


const CATEGORIES: SupplierCategory[] = [
  "carrier_last_mile",
  "carrier_international",
  "warehouse_supplies",
  "packaging_materials",
  "reverse_logistics",
  "fleet_maintenance",
  "it_and_wms_software",
  "cleaning_and_facilities",
];


function toCountryCurrency(country: SupplierCountry): SupplierCurrency {
  return country === "USA" ? "USD" : "EUR";
}


function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-ES");
}


export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mutationKey, setMutationKey] = useState<string | null>(null);

  const [filterCountry, setFilterCountry] = useState<"" | SupplierCountry>("");
  const [filterCategory, setFilterCategory] = useState<"" | SupplierCategory>("");

  const [formData, setFormData] = useState<SupplierCreatePayload>({
    name: "",
    country: "USA",
    categories: [],
    rate_per_shipment: 0,
    currency: "USD",
    status: "active",
    service_zone: "",
    contact_email: "",
    notes: "",
  });

  const [rateDrafts, setRateDrafts] = useState<Record<number, string>>({});

  const hasActiveFilters = useMemo(
    () => Boolean(filterCountry || filterCategory),
    [filterCountry, filterCategory],
  );

  async function loadSuppliers() {
    setLoading(true);
    setError("");

    try {
      const data = await listSuppliers({
        country: filterCountry || undefined,
        category: filterCategory || undefined,
      });

      setSuppliers(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No fue posible cargar los proveedores.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCountry, filterCategory]);

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setFormData({
      name: "",
      country: "USA",
      categories: [],
      rate_per_shipment: 0,
      currency: "USD",
      status: "active",
      service_zone: "",
      contact_email: "",
      notes: "",
    });
  }

  function validateCreatePayload(payload: SupplierCreatePayload): string | null {
    if (!payload.name.trim()) {
      return "El nombre es obligatorio.";
    }

    if (payload.categories.length === 0) {
      return "Debes seleccionar al menos una categoria.";
    }

    if (payload.rate_per_shipment <= 0) {
      return "La tarifa debe ser mayor que 0.";
    }

    const expectedCurrency = toCountryCurrency(payload.country);

    if (payload.currency !== expectedCurrency) {
      return `Para ${payload.country} la moneda debe ser ${expectedCurrency}.`;
    }

    return null;
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    const validationError = validateCreatePayload(formData);

    if (validationError) {
      setError(validationError);
      return;
    }

    setMutationKey("create");

    try {
      const payload: SupplierCreatePayload = {
        ...formData,
        name: formData.name.trim(),
        service_zone: formData.service_zone?.trim() || undefined,
        contact_email: formData.contact_email?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      await createSupplier(payload);
      setSuccess("Proveedor creado correctamente.");
      resetForm();
      await loadSuppliers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No fue posible crear el proveedor.",
      );
    } finally {
      setMutationKey(null);
    }
  }

  async function handleRateUpdate(supplier: Supplier) {
    clearFeedback();

    const draft = rateDrafts[supplier.id];
    const parsed = Number(draft);

    if (!draft || Number.isNaN(parsed) || parsed <= 0) {
      setError("La nueva tarifa debe ser mayor que 0.");
      return;
    }

    const key = `rate-${supplier.id}`;
    setMutationKey(key);

    try {
      await updateSupplierRate(supplier.id, {
        rate_per_shipment: parsed,
      });

      setSuccess(`Tarifa actualizada para ${supplier.name}.`);
      await loadSuppliers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No fue posible actualizar la tarifa.",
      );
    } finally {
      setMutationKey(null);
    }
  }

  async function handleStatusToggle(supplier: Supplier) {
    clearFeedback();

    const nextStatus: SupplierStatus = supplier.status === "active"
      ? "suspended"
      : "active";

    const key = `status-${supplier.id}`;
    setMutationKey(key);

    try {
      await updateSupplierStatus(supplier.id, {
        status: nextStatus,
      });

      setSuccess(`Estado actualizado para ${supplier.name}.`);
      await loadSuppliers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No fue posible actualizar el estado.",
      );
    } finally {
      setMutationKey(null);
    }
  }

  async function handleDelete(supplier: Supplier) {
    clearFeedback();

    const confirmed = window.confirm(
      `Vas a eliminar a ${supplier.name}. Esta accion no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    const key = `delete-${supplier.id}`;
    setMutationKey(key);

    try {
      await deleteSupplier(supplier.id);
      setSuccess(`Proveedor ${supplier.name} eliminado.`);
      await loadSuppliers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No fue posible eliminar el proveedor.",
      );
    } finally {
      setMutationKey(null);
    }
  }

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">
          Directorio de proveedores
        </h1>

        <p className="subtitle">
          Gestion centralizada de proveedores para USA y Spain.
        </p>

        {error && (
          <div className="feedback feedbackError">
            {error}
          </div>
        )}

        {success && (
          <div className="feedback feedbackSuccess">
            {success}
          </div>
        )}
      </section>

      <section className="card">
        <h2>
          Filtros
        </h2>

        <div className="controlsRow">
          <div className="field">
            <label htmlFor="filterCountry">
              Pais
            </label>

            <select
              id="filterCountry"
              value={filterCountry}
              onChange={(event) => {
                setFilterCountry(
                  event.target.value as "" | SupplierCountry,
                );
              }}
              disabled={loading || Boolean(mutationKey)}
            >
              <option value="">
                Todos
              </option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="filterCategory">
              Categoria
            </label>

            <select
              id="filterCategory"
              value={filterCategory}
              onChange={(event) => {
                setFilterCategory(
                  event.target.value as "" | SupplierCategory,
                );
              }}
              disabled={loading || Boolean(mutationKey)}
            >
              <option value="">
                Todas
              </option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="actions">
          <button
            type="button"
            className="button buttonSecondary"
            onClick={() => {
              setFilterCountry("");
              setFilterCategory("");
            }}
            disabled={!hasActiveFilters || loading || Boolean(mutationKey)}
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      <section className="card">
        <h2>
          Alta de proveedor
        </h2>

        <form onSubmit={handleCreate}>
          <div className="controlsRow">
            <div className="field">
              <label htmlFor="name">
                Nombre *
              </label>
              <input
                id="name"
                value={formData.name}
                onChange={(event) => {
                  setFormData((current) => ({
                    ...current,
                    name: event.target.value,
                  }));
                }}
                disabled={mutationKey === "create"}
              />
            </div>

            <div className="field">
              <label htmlFor="country">
                Pais *
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(event) => {
                  const country = event.target.value as SupplierCountry;
                  setFormData((current) => ({
                    ...current,
                    country,
                    currency: toCountryCurrency(country),
                  }));
                }}
                disabled={mutationKey === "create"}
              >
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="currency">
                Moneda *
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(event) => {
                  setFormData((current) => ({
                    ...current,
                    currency: event.target.value as SupplierCurrency,
                  }));
                }}
                disabled={mutationKey === "create"}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="rate_per_shipment">
                Tarifa *
              </label>
              <input
                id="rate_per_shipment"
                type="number"
                step="0.01"
                min="0.01"
                value={String(formData.rate_per_shipment)}
                onChange={(event) => {
                  setFormData((current) => ({
                    ...current,
                    rate_per_shipment: Number(event.target.value),
                  }));
                }}
                disabled={mutationKey === "create"}
              />
            </div>

            <div className="field">
              <label htmlFor="status">
                Estado *
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(event) => {
                  setFormData((current) => ({
                    ...current,
                    status: event.target.value as SupplierStatus,
                  }));
                }}
                disabled={mutationKey === "create"}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="service_zone">
                Zona de servicio
              </label>
              <input
                id="service_zone"
                value={formData.service_zone ?? ""}
                onChange={(event) => {
                  setFormData((current) => ({
                    ...current,
                    service_zone: event.target.value,
                  }));
                }}
                disabled={mutationKey === "create"}
              />
            </div>

            <div className="field">
              <label htmlFor="contact_email">
                Email de contacto
              </label>
              <input
                id="contact_email"
                type="email"
                value={formData.contact_email ?? ""}
                onChange={(event) => {
                  setFormData((current) => ({
                    ...current,
                    contact_email: event.target.value,
                  }));
                }}
                disabled={mutationKey === "create"}
              />
            </div>

            <div className="field">
              <label htmlFor="notes">
                Notas
              </label>
              <textarea
                id="notes"
                value={formData.notes ?? ""}
                onChange={(event) => {
                  setFormData((current) => ({
                    ...current,
                    notes: event.target.value,
                  }));
                }}
                disabled={mutationKey === "create"}
              />
            </div>
          </div>

          <div className="field">
            <label>
              Categorias *
            </label>

            <div className="categoriesGrid">
              {CATEGORIES.map((category) => {
                const checked = formData.categories.includes(category);

                return (
                  <label key={category} className="checkboxItem">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setFormData((current) => {
                          const nextCategories = event.target.checked
                            ? [...current.categories, category]
                            : current.categories.filter((item) => item !== category);

                          return {
                            ...current,
                            categories: nextCategories,
                          };
                        });
                      }}
                      disabled={mutationKey === "create"}
                    />
                    <span>{category}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="actions">
            <button
              type="submit"
              className="button buttonPrimary"
              disabled={mutationKey === "create"}
            >
              {mutationKey === "create" ? "Guardando..." : "Crear proveedor"}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>
          Proveedores
        </h2>

        {loading ? (
          <p className="muted">
            Cargando proveedores...
          </p>
        ) : suppliers.length === 0 ? (
          <p className="muted">
            No hay proveedores para los filtros actuales.
          </p>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Pais</th>
                  <th>Categorias</th>
                  <th>Tarifa</th>
                  <th>Moneda</th>
                  <th>Estado</th>
                  <th>Zona</th>
                  <th>Email</th>
                  <th>Updated At</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => {
                  const rateMutation = mutationKey === `rate-${supplier.id}`;
                  const statusMutation = mutationKey === `status-${supplier.id}`;
                  const deleteMutation = mutationKey === `delete-${supplier.id}`;
                  const newRate = rateDrafts[supplier.id] ?? String(supplier.rate_per_shipment);

                  return (
                    <tr key={supplier.id}>
                      <td>{supplier.name}</td>
                      <td>{supplier.country}</td>
                      <td>{supplier.categories.join(", ")}</td>
                      <td>
                        <div className="inlineEdit">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={newRate}
                            onChange={(event) => {
                              setRateDrafts((current) => ({
                                ...current,
                                [supplier.id]: event.target.value,
                              }));
                            }}
                            disabled={Boolean(mutationKey)}
                          />
                          <button
                            type="button"
                            className="button buttonSecondary"
                            disabled={Boolean(mutationKey)}
                            onClick={() => {
                              void handleRateUpdate(supplier);
                            }}
                          >
                            {rateMutation ? "Guardando..." : "Actualizar"}
                          </button>
                        </div>
                      </td>
                      <td>{supplier.currency}</td>
                      <td>
                        <span
                          className={[
                            "statusBadge",
                            supplier.status === "active"
                              ? "statusActive"
                              : "statusSuspended",
                          ].join(" ")}
                        >
                          {supplier.status}
                        </span>
                      </td>
                      <td>{supplier.service_zone ?? "-"}</td>
                      <td>{supplier.contact_email ?? "-"}</td>
                      <td>{formatDate(supplier.updated_at)}</td>
                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            className="button buttonWarn"
                            disabled={Boolean(mutationKey)}
                            onClick={() => {
                              void handleStatusToggle(supplier);
                            }}
                          >
                            {statusMutation
                              ? "Guardando..."
                              : supplier.status === "active"
                                ? "Suspender"
                                : "Activar"}
                          </button>

                          <button
                            type="button"
                            className="button buttonDanger"
                            disabled={Boolean(mutationKey)}
                            onClick={() => {
                              void handleDelete(supplier);
                            }}
                          >
                            {deleteMutation ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
