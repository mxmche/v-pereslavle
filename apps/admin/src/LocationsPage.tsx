import { Fragment, useCallback, useEffect, useState } from 'react';
import { api, type Location } from './api';

function LocationForm({ location, onSaved }: { location: Location; onSaved: () => void }) {
  const [name, setName] = useState(location.name);
  const [address, setAddress] = useState(location.address ?? '');
  const [aliases, setAliases] = useState(location.aliases.join('\n'));
  const [error, setError] = useState<string | null>(null);

  async function save() {
    try {
      await api(`/admin/locations/${location.id}`, {
        method: 'PATCH',
        body: { name, address: address || null, aliases: aliases.split('\n').map((a) => a.trim()).filter(Boolean) },
      });
      setError(null);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="panel">
      <label>Название<input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>Адрес<input value={address} onChange={(e) => setAddress(e.target.value)} /></label>
      <label>Алиасы (по одному в строке — по ним события привязываются к площадке)
        <textarea rows={4} value={aliases} onChange={(e) => setAliases(e.target.value)} />
      </label>
      {error && <div className="err">{error}</div>}
      <div><button className="primary" onClick={save}>Сохранить</button></div>
    </div>
  );
}

export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Location[]>('/admin/locations').then(setLocations).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  return (
    <>
      <h1>Площадки</h1>
      {error && <div className="err">Ошибка загрузки: {error}</div>}
      <table>
        <thead><tr><th>Название</th><th>Адрес</th><th>События</th><th /></tr></thead>
        <tbody>
          {locations.map((l) => (
            <Fragment key={l.id}>
              <tr>
                <td>{l.name}</td>
                <td className="muted">{l.address ?? '—'}</td>
                <td>{l._count?.events ?? 0}</td>
                <td className="actions"><button onClick={() => setOpen(open === l.id ? null : l.id)}>{open === l.id ? 'Скрыть' : 'Править'}</button></td>
              </tr>
              {open === l.id && <tr><td colSpan={4}><LocationForm location={l} onSaved={load} /></td></tr>}
            </Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
}
