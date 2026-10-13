"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { api } from "@/lib/api-client";

type Option = { id: string; name: string; avatarUrl: string | null };

export function ProfilePicker({ profiles, currentId, next }: { profiles: Option[]; currentId: string | null; next: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(id: string) {
    setBusy(id);
    setError(null);
    try {
      await api("/api/auth/profile", { body: { userId: id } });
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seçilemedi.");
      setBusy(null);
    }
  }

  return (
    <div className="stack">
      <div className="profile-options">
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            className="profile-option"
            aria-current={p.id === currentId ? "true" : undefined}
            onClick={() => choose(p.id)}
            disabled={busy !== null}
          >
            <Avatar name={p.name} url={p.avatarUrl} size={72} />
            <span className="profile-name">{p.name}</span>
            {p.id === currentId && (
              <span className="profile-current">
                <Check size={14} /> Şu an seçili
              </span>
            )}
            {busy === p.id && <span className="muted small">Açılıyor…</span>}
          </button>
        ))}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
