import { useEffect, useState } from 'react';

interface Source {
  id: string;
  name: string;
  url: string;
  type: string;
  enabled: boolean;
  lastRunAt: string | null;
  lastStatus: string | null;
}

export function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/sources')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setSources)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main>
      <h1>Источники</h1>
      {error && <p>Ошибка загрузки: {error}</p>}
      <table>
        <thead>
          <tr><th>Название</th><th>Тип</th><th>Вкл</th><th>Последний запуск</th><th>Статус</th></tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.id}>
              <td><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a></td>
              <td>{s.type}</td>
              <td>{s.enabled ? '✓' : '—'}</td>
              <td>{s.lastRunAt ?? '—'}</td>
              <td>{s.lastStatus ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
