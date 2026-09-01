"use client";


import { useEffect, useState } from "react";

import {
  ApiError,
  getCurrentUser,
  updateMyProfile,
} from "@/lib/auth";


export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const user = await getCurrentUser();

        if (!active) {
          return;
        }

        setEmail(user.email);
        setName(user.profile?.name ?? "");
        setPhone(user.profile?.phone ?? "");
        setAddress(user.profile?.address ?? "");
      } catch (caught) {
        if (!active) {
          return;
        }

        setError(
          caught instanceof ApiError
            ? caught.message
            : "No se pudo cargar el perfil.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const profile = await updateMyProfile({
        name,
        phone,
        address,
      });

      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
      setAddress(profile.address ?? "");
      setSuccess("Perfil actualizado.");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "No se pudo actualizar el perfil.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="authPage">
        <p className="authSubtitle">
          Cargando perfil...
        </p>
      </main>
    );
  }

  return (
    <main className="authPage">
      <h1 className="authTitle">
        Mi perfil
      </h1>

      <p className="authSubtitle">
        {email}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="authField">
          <label htmlFor="name">
            Nombre
          </label>

          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="authField">
          <label htmlFor="phone">
            Telefono
          </label>

          <input
            id="phone"
            name="phone"
            type="text"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>

        <div className="authField">
          <label htmlFor="address">
            Direccion
          </label>

          <input
            id="address"
            name="address"
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </div>

        {error ? (
          <p className="authError">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="authSuccess">
            {success}
          </p>
        ) : null}

        <button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </main>
  );
}
