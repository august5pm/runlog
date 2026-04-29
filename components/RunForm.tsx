"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseOptionalBpm, parseOptionalCadence } from "@/lib/run-fields";

type RunValue = {
  id?: string;
  date: string;
  distanceKm: string;
  durationMin: string;
  durationSec: string;
  avgHeartRate: string;
  cadence: string;
  notes: string;
};

function toInputDate(d: Date): string {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function RunForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: {
    id: string;
    date: Date;
    distanceKm: number;
    durationSec: number;
    avgHeartRate: number | null;
    cadence: number | null;
    notes: string | null;
  };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const min = Math.floor((initial?.durationSec ?? 0) / 60);
  const sec = (initial?.durationSec ?? 0) % 60;

  const [values, setValues] = useState<RunValue>({
    date: initial ? toInputDate(initial.date) : toInputDate(new Date()),
    distanceKm: initial ? String(initial.distanceKm) : "",
    durationMin: initial ? String(min) : "",
    durationSec: initial ? String(sec) : "",
    avgHeartRate:
      initial?.avgHeartRate != null && initial.avgHeartRate > 0
        ? String(initial.avgHeartRate)
        : "",
    cadence:
      initial?.cadence != null && initial.cadence > 0
        ? String(initial.cadence)
        : "",
    notes: initial?.notes ?? "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const dist = Number(values.distanceKm);
    const dm = Number(values.durationMin || 0);
    const ds = Number(values.durationSec || 0);
    if (!values.date || !Number.isFinite(dist) || dist <= 0) {
      setError("날짜와 거리를 확인해 주세요.");
      return;
    }
    if (!Number.isFinite(dm) || !Number.isFinite(ds) || dm < 0 || ds < 0 || ds >= 60) {
      setError("시간(분·초)을 확인해 주세요. 초는 0~59입니다.");
      return;
    }
    const durationSec = Math.round(dm * 60 + ds);
    if (durationSec <= 0) {
      setError("운동 시간은 1초 이상이어야 합니다.");
      return;
    }

    const hr = parseOptionalBpm(
      values.avgHeartRate.trim() === "" ? "" : values.avgHeartRate,
    );
    if (!hr.ok) {
      setError(hr.error);
      return;
    }
    const cad = parseOptionalCadence(
      values.cadence.trim() === "" ? "" : values.cadence,
    );
    if (!cad.ok) {
      setError(cad.error);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date: new Date(values.date + "T12:00:00").toISOString(),
        distanceKm: dist,
        durationSec,
        avgHeartRate: hr.value,
        cadence: cad.value,
        notes: values.notes.trim() || null,
      };
      const url =
        mode === "create" ? "/api/runs" : `/api/runs/${initial?.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError((j as { error?: string }).error ?? "저장에 실패했습니다.");
        return;
      }
      router.push("/runs");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (mode !== "edit" || !initial?.id) return;
    if (!confirm("이 기록을 삭제할까요? 되돌릴 수 없습니다.")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/runs/${initial.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("삭제에 실패했습니다.");
        return;
      }
      router.push("/runs");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md space-y-4 rounded-card border border-border bg-surface p-5 shadow-card"
    >
      {error ? (
        <p className="text-caption text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <label htmlFor="date" className="mb-1 block text-caption font-medium text-foreground">
          활동일
        </label>
        <input
          id="date"
          type="date"
          required
          value={values.date}
          onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
          className="w-full rounded-input border border-border bg-bg px-3 py-2 text-body text-foreground focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent"
        />
      </div>
      <div>
        <label htmlFor="km" className="mb-1 block text-caption font-medium text-foreground">
          거리 (km)
        </label>
        <input
          id="km"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          required
          value={values.distanceKm}
          onChange={(e) => setValues((v) => ({ ...v, distanceKm: e.target.value }))}
          className="w-full rounded-input border border-border bg-bg px-3 py-2 font-numeric text-body text-foreground focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="min" className="mb-1 block text-caption font-medium text-foreground">
            시간 (분)
          </label>
          <input
            id="min"
            type="number"
            inputMode="numeric"
            min="0"
            required
            value={values.durationMin}
            onChange={(e) => setValues((v) => ({ ...v, durationMin: e.target.value }))}
            className="w-full rounded-input border border-border bg-bg px-3 py-2 font-numeric text-body text-foreground focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent"
          />
        </div>
        <div>
          <label htmlFor="sec" className="mb-1 block text-caption font-medium text-foreground">
            초 (0–59)
          </label>
          <input
            id="sec"
            type="number"
            inputMode="numeric"
            min="0"
            max="59"
            required
            value={values.durationSec}
            onChange={(e) => setValues((v) => ({ ...v, durationSec: e.target.value }))}
            className="w-full rounded-input border border-border bg-bg px-3 py-2 font-numeric text-body text-foreground focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="hr"
            className="mb-1 block text-caption font-medium text-foreground"
          >
            평균 심박 (bpm, 선택)
          </label>
          <input
            id="hr"
            type="number"
            inputMode="numeric"
            min={40}
            max={230}
            placeholder="—"
            value={values.avgHeartRate}
            onChange={(e) =>
              setValues((v) => ({ ...v, avgHeartRate: e.target.value }))
            }
            className="w-full rounded-input border border-border bg-bg px-3 py-2 font-numeric text-body text-foreground focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent"
          />
        </div>
        <div>
          <label
            htmlFor="cadence"
            className="mb-1 block text-caption font-medium text-foreground"
          >
            케이던스 (spm, 선택)
          </label>
          <input
            id="cadence"
            type="number"
            inputMode="numeric"
            min={60}
            max={240}
            placeholder="걸음/분"
            value={values.cadence}
            onChange={(e) =>
              setValues((v) => ({ ...v, cadence: e.target.value }))
            }
            className="w-full rounded-input border border-border bg-bg px-3 py-2 font-numeric text-body text-foreground focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent"
          />
        </div>
      </div>
      <p className="text-caption text-muted">
        케이던스는 분당 보폭 수(spm) 기준입니다.
      </p>
      <div>
        <label htmlFor="notes" className="mb-1 block text-caption font-medium text-foreground">
          메모
        </label>
        <textarea
          id="notes"
          rows={3}
          value={values.notes}
          onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          className="w-full rounded-input border border-border bg-bg px-3 py-2 text-body text-foreground focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent"
        />
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || deleting}
          className="rounded-button bg-accent px-4 py-2.5 text-caption font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
        >
          {submitting ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-button border border-border bg-surface px-4 py-2.5 text-caption font-semibold text-foreground hover:bg-accent-muted"
        >
          취소
        </button>
        {mode === "edit" ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={submitting || deleting}
            className="rounded-button bg-danger px-4 py-2.5 text-caption font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {deleting ? "삭제 중…" : "삭제"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
