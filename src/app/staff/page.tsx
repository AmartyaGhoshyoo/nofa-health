"use client";

// Staff portal: doctors see their own day; reception and the manager see everyone.
// "Running late" previews which patients are affected before anyone is notified.
// Demo sign-in (name + PIN); the session token lives in this browser tab only.

import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { site } from "@/config/site";

type Role = "doctor" | "receptionist" | "manager";
interface Me {
  id: string;
  name: string;
  role: Role;
  doctor_id: string | null;
}
interface Booking {
  id: string;
  start: string;
  end: string;
  patient: string;
  phone: string | null;
  email: string | null;
  service: string;
  source: string;
  delay: { status: string; choice: string | null; original_start: string } | null;
}
interface DoctorDay {
  id: string;
  name: string;
  specialty: string;
  hours: string;
  bookings: Booking[];
}
interface PlanItem {
  booking_id: string;
  patient: string;
  phone: string | null;
  service: string;
  original_start: string;
  shifted_start: string | null;
  options: { id: string; kind: string; label: string }[];
  default_option: string | null;
  status: string;
  choice: string | null;
  notified_via: string[];
}
interface Plan {
  id: string;
  doctor_id: string;
  doctor_name: string;
  delay_minutes: number;
  reported_by: string;
  status: string;
  sent_at: string | null;
  starts_at: string | null; // when the delay counts from
  note: string; // why nobody is affected
  items: PlanItem[];
}

const TOKEN_KEY = "nofa-staff-token";
// The assistant chat on screen, kept for this sign-in so it matches the assistant's memory.
const CHAT_KEY = "nofa-staff-chat";
const tz = { timeZone: "Asia/Dhaka" } as const;
const t = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { ...tz, hour: "numeric", minute: "2-digit" });
const dayLabel = (iso: string) =>
  new Date(iso + "T12:00:00+06:00").toLocaleDateString("en-US", { ...tz, weekday: "long", month: "short", day: "numeric" });
const dayTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { ...tz, weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const dhakaDate = (offset: number) => {
  const d = new Date(Date.now() + offset * 86400000);
  return d.toLocaleDateString("en-CA", tz); // YYYY-MM-DD
};

async function api<T>(path: string, token: string | null, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api/staff/${path}`, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json", ...(token ? { "x-staff-token": token } : {}) },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? `Error ${res.status}`), { status: res.status });
  return data as T;
}

function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function writeToken(token: string | null) {
  try {
    sessionStorage.removeItem(CHAT_KEY); // a new sign-in (or sign-out) starts a clean chat
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode: the session just won't survive a reload */
  }
}

export default function StaffPage() {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = readToken();
    if (!saved) return setChecking(false);
    api<Me>("me", saved)
      .then((m) => {
        setToken(saved);
        setMe(m);
      })
      .catch(() => writeToken(null))
      .finally(() => setChecking(false));
  }, []);

  function signOut() {
    if (token) api("logout", token, { method: "POST" }).catch(() => {});
    writeToken(null);
    setToken(null);
    setMe(null);
  }

  return (
    <main className="min-h-dvh bg-canvas font-widget text-ink">
      {checking ? null : token && me ? (
        <Portal token={token} me={me} onSignOut={signOut} onExpired={signOut} />
      ) : (
        <SignIn
          onSignedIn={(tk, m) => {
            writeToken(tk);
            setToken(tk);
            setMe(m);
          }}
        />
      )}
    </main>
  );
}

// ── Sign in ──────────────────────────────────────────────────────────────────

function SignIn({ onSignedIn }: { onSignedIn: (token: string, me: Me) => void }) {
  const [people, setPeople] = useState<{ id: string; name: string; role: Role }[]>([]);
  const [staffId, setStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ id: string; name: string; role: Role }[]>("directory", null)
      .then((list) => {
        setPeople(list);
        setStaffId(list[0]?.id ?? "");
      })
      .catch((e) => setError(e.message));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ token: string; staff: Me }>("login", null, { method: "POST", body: { staff_id: staffId, pin } });
      onSignedIn(r.token, r.staff);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <p className="text-[0.8rem] font-bold uppercase tracking-wider text-teal">{site.name} · Staff</p>
      <h1 className="mt-1 text-2xl font-bold">Sign in</h1>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl border border-line bg-surface p-5 shadow-sm">
        <label className="block text-[0.86rem] font-bold">
          Who are you?
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 font-normal"
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[0.86rem] font-bold">
          PIN
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-line-strong px-3 py-2.5 font-normal"
          />
        </label>
        {error && (
          <p role="alert" className="text-[0.84rem] text-amber">
            {error}
          </p>
        )}
        <button
          disabled={busy || !pin}
          className="w-full cursor-pointer rounded-xl bg-teal py-3 font-bold text-white disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-[0.76rem] text-ink-faint">Demo PINs: doctors 1111–4444, reception 5555, manager 9999.</p>
      </form>
    </div>
  );
}

// ── Portal ───────────────────────────────────────────────────────────────────

type Tab = "today" | "late" | "updates" | "assistant";

function Portal({ token, me, onSignOut, onExpired }: { token: string; me: Me; onSignOut: () => void; onExpired: () => void }) {
  const [tab, setTab] = useState<Tab>("today");
  const call = useCallback(
    async <T,>(path: string, init?: { method?: string; body?: unknown }) => {
      try {
        return await api<T>(path, token, init);
      } catch (err) {
        if ((err as { status?: number }).status === 401) onExpired();
        throw err;
      }
    },
    [token, onExpired]
  );
  const tabs: [Tab, string][] = [
    ["today", "Schedule"],
    ["late", "Running late"],
    ["updates", "Patient updates"],
    ["assistant", "Assistant"],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <div>
          <p className="text-[0.78rem] font-bold uppercase tracking-wider text-teal">{site.name} · Staff portal</p>
          <h1 className="text-xl font-bold">{me.name}</h1>
          <p className="text-[0.84rem] capitalize text-ink-muted">
            {me.role === "doctor" ? "Your schedule" : `${me.role} · all doctors`}
          </p>
        </div>
        <button onClick={onSignOut} className="cursor-pointer rounded-full border border-line-strong px-4 py-2 text-[0.86rem] font-bold">
          Sign out
        </button>
      </header>
      <nav role="tablist" className="mb-5 flex gap-1 overflow-x-auto rounded-full bg-canvas-soft p-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-[0.88rem] font-bold transition-colors ${
              tab === id ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-faint hover:text-ink-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "today" && <Schedule call={call} />}
      {tab === "late" && <RunningLate call={call} me={me} onSent={() => setTab("updates")} />}
      {tab === "updates" && <Updates call={call} />}
      {tab === "assistant" && <Assistant call={call} me={me} />}
    </div>
  );
}

type Call = <T>(path: string, init?: { method?: string; body?: unknown }) => Promise<T>;

function usePoll<T>(load: () => Promise<T>, every = 5000, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const tick = () =>
      load()
        .then((d) => alive && (setData(d), setError(null)))
        .catch((e) => alive && setError((e as Error).message));
    tick();
    const id = setInterval(tick, every);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, error };
}

const STATUS: Record<string, [string, string]> = {
  planned: ["Planned", "bg-canvas-soft text-ink-muted"],
  notified: ["Waiting for patient", "bg-amber-soft text-amber"],
  no_reply: ["No reply · kept new time", "bg-canvas-soft text-ink-muted"],
  kept: ["Kept new time", "bg-mint-soft text-mint"],
  rescheduled: ["Rescheduled", "bg-mint-soft text-mint"],
  cancelled: ["Cancelled", "bg-rose-soft text-rose"],
  needs_staff: ["Needs staff", "bg-rose-soft text-rose"],
};

function Badge({ status }: { status: string }) {
  const [label, cls] = STATUS[status] ?? [status, "bg-canvas-soft text-ink-muted"];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.74rem] font-bold ${cls}`}>{label}</span>;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-line bg-surface p-4 shadow-sm ${className}`}>{children}</section>;
}

// ── Schedule ─────────────────────────────────────────────────────────────────

function Schedule({ call }: { call: Call }) {
  const [offset, setOffset] = useState(0);
  const day = dhakaDate(offset);
  const { data, error } = usePoll(() => call<{ day: string; doctors: DoctorDay[] }>(`schedule?day=${day}`), 5000, [day]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {["Today", "Tomorrow"].map((label, i) => (
          <button
            key={label}
            onClick={() => setOffset(i)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-[0.86rem] font-bold ${
              offset === i ? "bg-teal text-white" : "border border-line-strong text-ink-muted"
            }`}
          >
            {label}
          </button>
        ))}
        {/* Any other day: step a day at a time, or pick a date. */}
        <div className="ml-1 flex items-center gap-1">
          <button
            onClick={() => setOffset(offset - 1)}
            aria-label="Previous day"
            className="h-9 w-9 cursor-pointer rounded-full border border-line-strong text-ink-muted hover:bg-canvas-soft"
          >
            ‹
          </button>
          <input
            type="date"
            value={day}
            aria-label="Pick a day"
            onChange={(e) => {
              if (!e.target.value) return;
              const at = (iso: string) => Date.parse(iso + "T12:00:00+06:00");
              setOffset(Math.round((at(e.target.value) - at(dhakaDate(0))) / 86400000));
            }}
            className="h-9 rounded-full border border-line-strong bg-surface px-3 text-[0.86rem] text-ink"
          />
          <button
            onClick={() => setOffset(offset + 1)}
            aria-label="Next day"
            className="h-9 w-9 cursor-pointer rounded-full border border-line-strong text-ink-muted hover:bg-canvas-soft"
          >
            ›
          </button>
        </div>
        <span className="ml-2 text-[0.88rem] text-ink-muted">{dayLabel(day)}</span>
      </div>
      {error && <p className="text-amber">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data?.doctors.map((d) => (
          <Card key={d.id}>
            <p className="font-bold">{d.name}</p>
            <p className="text-[0.8rem] text-ink-muted">
              {d.specialty} · {d.hours}
            </p>
            <ul className="mt-3 space-y-2">
              {d.bookings.length === 0 && <li className="text-[0.84rem] text-ink-faint">No appointments.</li>}
              {d.bookings.map((b) => (
                <li
                  key={b.id}
                  className={`rounded-2xl bg-canvas/60 p-2.5 ${new Date(b.end).getTime() < Date.now() ? "opacity-45" : ""}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold tabular-nums">{t(b.start)}</span>
                    {b.delay && <Badge status={b.delay.status} />}
                  </div>
                  <p className="text-[0.88rem]">{b.patient}</p>
                  <p className="text-[0.76rem] text-ink-faint">
                    {b.service}
                    {b.phone && ` · ${b.phone}`}
                    {b.delay && ` · was ${t(b.delay.original_start)}`}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Running late ─────────────────────────────────────────────────────────────

function RunningLate({ call, me, onSent }: { call: Call; me: Me; onSent: () => void }) {
  const [doctors, setDoctors] = useState<DoctorDay[]>([]);
  const [doctorId, setDoctorId] = useState(me.doctor_id ?? "");
  const [minutes, setMinutes] = useState(30);
  // "Now" lets the backend pick the moment (now, or the doctor's next start time);
  // a specific time is for "30 minutes late for my 1:00".
  const [fromWhen, setFromWhen] = useState<"now" | "time">("now");
  const [lateDate, setLateDate] = useState(dhakaDate(0));
  const [lateTime, setLateTime] = useState("13:00");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me.role === "doctor") return;
    call<{ doctors: DoctorDay[] }>(`schedule?day=${dhakaDate(0)}`).then((d) => {
      setDoctors(d.doctors);
      setDoctorId((current) => current || d.doctors[0]?.id || "");
    });
  }, [call, me.role]);

  async function run<T>(work: () => Promise<T>) {
    setBusy(true);
    setError(null);
    try {
      return await work();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const preview = () =>
    run(async () => {
      const lateFrom = fromWhen === "time" ? `${lateDate}T${lateTime}` : undefined;
      setPlan(await call<Plan>("delay/preview", { method: "POST", body: { doctor_id: doctorId, minutes, late_from: lateFrom } }));
    });
  const send = () =>
    run(async () => {
      await call<Plan>(`delay/${plan!.id}/send`, { method: "POST" });
      setPlan(null);
      onSent();
    });
  const discard = () =>
    run(async () => {
      await call(`delay/${plan!.id}`, { method: "DELETE" });
      setPlan(null);
    });

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
      <Card>
        <h2 className="text-lg font-bold">How late is the doctor?</h2>
        {me.role !== "doctor" && (
          <label className="mt-3 block text-[0.86rem] font-bold">
            Doctor
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 font-normal"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {[15, 30, 45, 60, 90].map((m) => (
            <button
              key={m}
              onClick={() => setMinutes(m)}
              className={`cursor-pointer rounded-xl px-3.5 py-2 text-[0.9rem] font-bold ${
                minutes === m ? "bg-teal text-white" : "border border-line-strong"
              }`}
            >
              {m} min
            </button>
          ))}
        </div>
        <label className="mt-3 block text-[0.82rem] text-ink-muted">
          Or exactly
          <input
            type="number"
            min={5}
            max={240}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="ml-2 w-20 rounded-lg border border-line-strong px-2 py-1"
          />{" "}
          minutes
        </label>
        <p className="mt-4 text-[0.86rem] font-bold">Late from</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {(
            [
              ["now", "Now"],
              ["time", "A specific time"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFromWhen(value)}
              className={`cursor-pointer rounded-xl px-3.5 py-2 text-[0.9rem] font-bold ${
                fromWhen === value ? "bg-teal text-white" : "border border-line-strong"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {fromWhen === "time" ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="date"
              value={lateDate}
              min={dhakaDate(0)}
              aria-label="Day"
              onChange={(e) => setLateDate(e.target.value)}
              className="rounded-lg border border-line-strong px-2 py-1.5"
            />
            <input
              type="time"
              value={lateTime}
              step={1800}
              aria-label="Time"
              onChange={(e) => setLateTime(e.target.value)}
              className="rounded-lg border border-line-strong px-2 py-1.5"
            />
          </div>
        ) : (
          <p className="mt-1.5 text-[0.76rem] text-ink-faint">
            Counts from now while the doctor is working; before their day starts, from their start time; after it
            ends, from their next day&apos;s start.
          </p>
        )}
        <button
          onClick={preview}
          disabled={busy || !doctorId}
          className="mt-4 w-full cursor-pointer rounded-xl bg-ink py-3 font-bold text-white disabled:opacity-50"
        >
          See who is affected
        </button>
        <p className="mt-2 text-[0.76rem] text-ink-faint">Nobody is notified until you confirm.</p>
        {error && <p className="mt-2 text-[0.84rem] text-amber">{error}</p>}
      </Card>

      <Card>
        {!plan ? (
          <p className="text-ink-faint">Choose the delay and press “See who is affected”.</p>
        ) : plan.items.length === 0 ? (
          <>
            <h2 className="text-lg font-bold">Nobody is affected</h2>
            {plan.starts_at && (
              <p className="text-[0.84rem] text-ink-muted">
                {plan.doctor_name} +{plan.delay_minutes} min, counted from {dayTime(plan.starts_at)}
              </p>
            )}
            <p className="mt-2">{plan.note || `The schedule absorbs a ${plan.delay_minutes}-minute delay.`} Nothing to send.</p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold">
              {plan.items.length} patient{plan.items.length > 1 ? "s" : ""} affected · {plan.doctor_name} +{plan.delay_minutes} min
            </h2>
            {plan.starts_at && (
              <p className="text-[0.84rem] font-bold text-teal">Counted from {dayTime(plan.starts_at)}</p>
            )}
            <p className="text-[0.84rem] text-ink-muted">
              Only appointments the delay reaches. Each patient gets their new time and can choose another option.
            </p>
            <ul className="mt-4 space-y-3">
              {plan.items.map((i) => (
                <li key={i.booking_id} className="rounded-2xl border border-line p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-bold">{i.patient}</span>
                    <span className="tabular-nums">
                      <span className="text-ink-faint line-through">{t(i.original_start)}</span>
                      <span className="mx-1.5">→</span>
                      <b>{i.shifted_start ? t(i.shifted_start) : "needs a new time"}</b>
                    </span>
                  </div>
                  <p className="text-[0.78rem] text-ink-faint">
                    {i.service}
                    {i.phone ? ` · ${i.phone}` : " · no phone on file"}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {i.options.map((o) => (
                      <li
                        key={o.id}
                        className={`rounded-full px-2.5 py-1 text-[0.76rem] ${
                          o.id === i.default_option ? "bg-teal-soft font-bold text-teal" : "bg-canvas-soft text-ink-muted"
                        }`}
                      >
                        {o.label}
                        {o.id === i.default_option && " · default"}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={send} disabled={busy} className="cursor-pointer rounded-xl bg-teal px-5 py-3 font-bold text-white disabled:opacity-50">
                Notify {plan.items.length} patient{plan.items.length > 1 ? "s" : ""}
              </button>
              <button onClick={discard} disabled={busy} className="cursor-pointer rounded-xl border border-line-strong px-5 py-3 font-bold">
                Discard
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// ── Patient updates ──────────────────────────────────────────────────────────

function Updates({ call }: { call: Call }) {
  const { data, error } = usePoll(() => call<Plan[]>("plans"), 4000);
  if (error) return <p className="text-amber">{error}</p>;
  if (!data) return null;
  if (data.length === 0) return <Card>No delay notices sent yet.</Card>;
  return (
    <div className="space-y-4">
      {data.map((p) => (
        <Card key={p.id}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-bold">
              {p.doctor_name} running {p.delay_minutes} min late
            </h2>
            <span className="text-[0.8rem] text-ink-faint">
              by {p.reported_by}
              {p.sent_at && ` · ${t(p.sent_at)}`}
            </span>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {p.items.map((i) => (
              <li key={i.booking_id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="font-bold">{i.patient}</p>
                  <p className="text-[0.78rem] text-ink-faint">
                    was {t(i.original_start)}
                    {i.choice ? ` · chose: ${i.choice}` : i.shifted_start ? ` · now ${t(i.shifted_start)}` : ""}
                    {i.notified_via.length > 0 && ` · via ${i.notified_via.join(", ")}`}
                  </p>
                </div>
                <Badge status={i.status} />
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

// ── Staff assistant ──────────────────────────────────────────────────────────

type ChatLine = { role: "you" | "nofa"; text: string };

function savedChat(): ChatLine[] | null {
  try {
    const saved = sessionStorage.getItem(CHAT_KEY);
    return saved ? (JSON.parse(saved) as ChatLine[]) : null;
  } catch {
    return null;
  }
}

function Assistant({ call, me }: { call: Call; me: Me }) {
  const [messages, setMessages] = useState<ChatLine[]>(
    () =>
      savedChat() ?? [
        {
          role: "nofa",
          text:
            me.role === "doctor"
              ? "Hi! Ask about your schedule, or tell me if you're running late — I'll show who's affected before notifying anyone."
              : "Hi! Ask about any doctor's schedule, or tell me which doctor is running late and by how much.",
        },
      ]
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view, including while a reply is being written out.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, thinking]);

  // Survive a page reload while signed in, so the screen matches what the assistant remembers.
  useEffect(() => {
    if (busy) return; // save whole replies, not half-written ones
    try {
      sessionStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    } catch {
      /* private mode: the chat just won't survive a reload */
    }
  }, [messages, busy]);

  // The reply arrives whole; write it out word by word, like the patient chat.
  async function reveal(reply: string) {
    const words = reply.split(/(\s+)/);
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMessages((m) => [...m, { role: "nofa", text: instant ? reply : "" }]);
    if (instant) return;
    for (let i = 1; i <= words.length; i += 2) {
      await new Promise((r) => setTimeout(r, 22));
      const text = words.slice(0, i + 1).join("");
      setMessages((m) => [...m.slice(0, -1), { role: "nofa", text }]);
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setMessages((m) => [...m, { role: "you", text }]);
    setInput("");
    setBusy(true);
    setThinking(true);
    try {
      const r = await call<{ reply: string }>("chat", { method: "POST", body: { message: text } });
      setThinking(false);
      await reveal(r.reply);
    } catch (err) {
      setThinking(false);
      setMessages((m) => [...m, { role: "nofa", text: `Sorry — ${(err as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex h-[min(640px,calc(100dvh-14rem))] flex-col">
      <div ref={listRef} data-lenis-prevent className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <p
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[0.92rem] ${
              m.role === "you" ? "ml-auto bg-teal text-white" : "border border-line bg-canvas/60"
            }`}
          >
            {m.text}
          </p>
        ))}
        {thinking && (
          <p className="inline-flex items-center gap-1 rounded-2xl border border-line bg-canvas/60 px-3.5 py-3" aria-label="Nofa is thinking">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </p>
        )}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={me.role === "doctor" ? "e.g. I'm running 40 minutes late" : "e.g. Dr. Rahman is 30 minutes late"}
          className="min-w-0 flex-1 rounded-xl border border-line-strong px-3.5 py-2.5"
        />
        <button disabled={busy || !input.trim()} className="cursor-pointer rounded-xl bg-teal px-5 font-bold text-white disabled:opacity-50">
          Send
        </button>
      </form>
    </Card>
  );
}
