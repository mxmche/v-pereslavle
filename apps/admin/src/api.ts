const TOKEN_KEY = 'vp_admin_token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t: string | null) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
};

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Fired on 401 so the shell can drop back to the login screen. */
export const UNAUTHORIZED = 'vp:unauthorized';

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    method: init.method ?? 'GET',
    headers: {
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 401 && path !== '/auth/login') window.dispatchEvent(new Event(UNAUTHORIZED));
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try { message = (JSON.parse(text) as { message?: string }).message ?? text; } catch { /* plain text */ }
    throw new ApiError(res.status, message || `HTTP ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export interface Source {
  id: string;
  name: string;
  url: string;
  type: string;
  adapter: string;
  config: unknown;
  enabled: boolean;
  scheduleCron: string;
  lastRunAt: string | null;
  lastStatus: 'OK' | 'ERROR' | 'RUNNING' | null;
  lastError: string | null;
}

export interface CrawlRun {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  found: number;
  created: number;
  updated: number;
  error: string | null;
}

export interface Location {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  address: string | null;
  _count?: { events: number };
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

export interface AdminEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  locationId: string | null;
  locationText: string | null;
  category: string;
  imageUrl: string | null;
  ticketUrl: string | null;
  status: EventStatus;
  location: { slug: string; name: string } | null;
  sources: { url: string | null; source: { name: string } }[];
}

export const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', dateStyle: 'short', timeStyle: 'short' }) : '—';

/** <input type="datetime-local"> value in Moscow time ⇄ ISO instant. */
export const toLocalInput = (iso: string | null) =>
  iso ? new Date(new Date(iso).getTime() + 3 * 3600_000).toISOString().slice(0, 16) : '';
export const fromLocalInput = (v: string) => (v ? new Date(`${v}:00+03:00`).toISOString() : null);
