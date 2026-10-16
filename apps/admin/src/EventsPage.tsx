import { Fragment, useCallback, useEffect, useState } from 'react';
import { api, fmtDateTime, fromLocalInput, toLocalInput, type AdminEvent, type EventStatus, type Location } from './api';

const STATUS_LABEL: Record<EventStatus, string> = { DRAFT: 'Черновик', PUBLISHED: 'Опубликовано', REJECTED: 'Отклонено', ARCHIVED: 'Архив' };
const CATEGORIES = ['concert', 'exhibition', 'excursion', 'festival', 'theatre', 'cinema', 'kids', 'lecture', 'sport', 'religious', 'other'];
const PAGE_SIZE = 50;

function EventForm({ event, locations, onSaved }: { event: AdminEvent; locations: Location[]; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: event.title,
    description: event.description ?? '',
    startsAt: toLocalInput(event.startsAt),
    endsAt: toLocalInput(event.endsAt),
    locationId: event.locationId ?? '',
    locationText: event.locationText ?? '',
    category: event.category,
    imageUrl: event.imageUrl ?? '',
    ticketUrl: event.ticketUrl ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function save() {
    try {
      await api(`/admin/events/${event.id}`, {
        method: 'PATCH',
        body: {
          title: form.title,
          description: form.description || null,
          startsAt: fromLocalInput(form.startsAt) ?? undefined,
          endsAt: fromLocalInput(form.endsAt),
          locationId: form.locationId || null,
          locationText: form.locationText || null,
          category: form.category,
          imageUrl: form.imageUrl || null,
          ticketUrl: form.ticketUrl || null,
        },
      });
      setError(null);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="panel">
      <label>Название<input value={form.title} onChange={set('title')} /></label>
      <label>Описание<textarea rows={5} value={form.description} onChange={set('description')} /></label>
      <div className="two">
        <label>Начало (МСК)<input type="datetime-local" value={form.startsAt} onChange={set('startsAt')} /></label>
        <label>Окончание (МСК)<input type="datetime-local" value={form.endsAt} onChange={set('endsAt')} /></label>
      </div>
      <div className="two">
        <label>Площадка
          <select value={form.locationId} onChange={set('locationId')}>
            <option value="">— не выбрана —</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
        <label>Место (текст из источника)<input value={form.locationText} onChange={set('locationText')} /></label>
      </div>
      <div className="two">
        <label>Категория
          <select value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Ссылка на билеты<input value={form.ticketUrl} onChange={set('ticketUrl')} /></label>
      </div>
      <label>Картинка (URL)<input value={form.imageUrl} onChange={set('imageUrl')} /></label>
      {event.sources.length > 0 && (
        <div className="muted">
          Источники: {event.sources.map((s, i) => <span key={i}>{i > 0 && ', '}{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.source.name}</a> : s.source.name}</span>)}
        </div>
      )}
      {error && <div className="err">{error}</div>}
      <div><button className="primary" onClick={save}>Сохранить</button></div>
    </div>
  );
}

export function EventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    api<AdminEvent[]>(`/admin/events?${params}`).then(setEvents).catch((e: Error) => setError(e.message));
  }, [status, q, offset]);
  useEffect(load, [load]);
  useEffect(() => { api<Location[]>('/admin/locations').then(setLocations).catch(() => undefined); }, []);

  async function setEventStatus(id: string, next: EventStatus) {
    await api(`/admin/events/${id}`, { method: 'PATCH', body: { status: next } });
    load();
  }

  return (
    <>
      <h1>События</h1>
      <div className="row">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setOffset(0); }}>
          <option value="">Все статусы</option>
          {(Object.keys(STATUS_LABEL) as EventStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <input placeholder="Поиск по названию" value={q} onChange={(e) => { setQ(e.target.value); setOffset(0); }} />
      </div>
      {error && <div className="err">Ошибка загрузки: {error}</div>}
      <table>
        <thead><tr><th>Название</th><th>Когда</th><th>Площадка</th><th>Статус</th><th /></tr></thead>
        <tbody>
          {events.map((e) => (
            <Fragment key={e.id}>
              <tr>
                <td>{e.title}</td>
                <td>{fmtDateTime(e.startsAt)}{e.endsAt ? ` – ${fmtDateTime(e.endsAt)}` : ''}</td>
                <td>{e.location?.name ?? <span className="muted">{e.locationText ?? '—'}</span>}</td>
                <td><span className={`badge ${e.status}`}>{STATUS_LABEL[e.status]}</span></td>
                <td className="actions">
                  {e.status !== 'PUBLISHED' && <button className="primary" onClick={() => setEventStatus(e.id, 'PUBLISHED')}>Опубликовать</button>}
                  {e.status !== 'REJECTED' && <button className="danger" onClick={() => setEventStatus(e.id, 'REJECTED')}>Отклонить</button>}
                  {e.status === 'PUBLISHED' && <button onClick={() => setEventStatus(e.id, 'ARCHIVED')}>В архив</button>}
                  <button onClick={() => setOpen(open === e.id ? null : e.id)}>{open === e.id ? 'Скрыть' : 'Править'}</button>
                </td>
              </tr>
              {open === e.id && <tr><td colSpan={5}><EventForm event={e} locations={locations} onSaved={load} /></td></tr>}
            </Fragment>
          ))}
          {events.length === 0 && <tr><td colSpan={5} className="muted">Ничего не найдено</td></tr>}
        </tbody>
      </table>
      <div className="row" style={{ marginTop: 12 }}>
        <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>← Назад</button>
        <button disabled={events.length < PAGE_SIZE} onClick={() => setOffset(offset + PAGE_SIZE)}>Вперёд →</button>
      </div>
    </>
  );
}
