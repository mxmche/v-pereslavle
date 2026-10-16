import { Fragment, useCallback, useEffect, useState } from 'react';
import { api, fmtDateTime, type CrawlRun, type Source } from './api';

function SourceDetails({ source, onSaved }: { source: Source; onSaved: () => void }) {
  const [runs, setRuns] = useState<CrawlRun[]>([]);
  const [cron, setCron] = useState(source.scheduleCron);
  const [allowImages, setAllowImages] = useState(source.allowImages);
  const [config, setConfig] = useState(JSON.stringify(source.config ?? {}, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api<CrawlRun[]>(`/admin/sources/${source.id}/runs`).then(setRuns).catch(() => setRuns([])); }, [source.id]);

  async function save() {
    try {
      await api(`/admin/sources/${source.id}`, { method: 'PATCH', body: { scheduleCron: cron, allowImages, config: JSON.parse(config) } });
      setError(null);
      onSaved();
    } catch (e) {
      setError(e instanceof SyntaxError ? 'Конфиг — невалидный JSON' : (e as Error).message);
    }
  }

  return (
    <div className="panel">
      <div className="two">
        <label>Расписание (cron)<input value={cron} onChange={(e) => setCron(e.target.value)} /></label>
        <label>Адаптер<input value={source.adapter} readOnly /></label>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="checkbox" checked={allowImages} onChange={(e) => setAllowImages(e.target.checked)} style={{ width: 'auto' }} />
        Показывать картинки этого источника на сайте (только если есть разрешение правообладателя)
      </label>
      <label>Конфиг (JSON)<textarea rows={4} value={config} onChange={(e) => setConfig(e.target.value)} /></label>
      {error && <div className="err">{error}</div>}
      <div><button className="primary" onClick={save}>Сохранить</button></div>
      <table>
        <thead><tr><th>Старт</th><th>Статус</th><th>Найдено</th><th>Новых</th><th>Обновлено</th><th>Ошибка</th></tr></thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id}>
              <td>{fmtDateTime(r.startedAt)}</td>
              <td><span className={`badge ${r.status}`}>{r.status}</span></td>
              <td>{r.found}</td><td>{r.created}</td><td>{r.updated}</td>
              <td className="muted">{r.error ?? ''}</td>
            </tr>
          ))}
          {runs.length === 0 && <tr><td colSpan={6} className="muted">Запусков ещё не было</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Source[]>('/admin/sources').then(setSources).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function toggle(s: Source) {
    await api(`/admin/sources/${s.id}`, { method: 'PATCH', body: { enabled: !s.enabled } });
    load();
  }

  async function run(s: Source) {
    const { queued } = await api<{ queued: boolean }>(`/admin/sources/${s.id}/run`, { method: 'POST' });
    setNote(queued ? `«${s.name}» поставлен в очередь` : `«${s.name}» уже в очереди или выполняется`);
    setTimeout(load, 5000);
  }

  return (
    <>
      <h1>Источники</h1>
      {error && <div className="err">Ошибка загрузки: {error}</div>}
      {note && <div className="muted">{note}</div>}
      <table>
        <thead><tr><th>Название</th><th>Тип</th><th>Вкл</th><th>Последний запуск</th><th>Статус</th><th /></tr></thead>
        <tbody>
          {sources.map((s) => (
            <Fragment key={s.id}>
              <tr>
                <td><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a></td>
                <td>{s.type}</td>
                <td><input type="checkbox" checked={s.enabled} onChange={() => toggle(s)} style={{ width: 'auto' }} /></td>
                <td>{fmtDateTime(s.lastRunAt)}</td>
                <td>
                  {s.lastStatus ? <span className={`badge ${s.lastStatus}`}>{s.lastStatus}</span> : '—'}
                  {s.lastError && <div className="err">{s.lastError}</div>}
                </td>
                <td className="actions">
                  <button onClick={() => run(s)}>Запустить сейчас</button>
                  <button onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? 'Скрыть' : 'Настройки'}</button>
                </td>
              </tr>
              {open === s.id && <tr><td colSpan={6}><SourceDetails source={s} onSaved={load} /></td></tr>}
            </Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
}
