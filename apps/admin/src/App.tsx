import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, UNAUTHORIZED, api, getToken, setToken } from './api';
import { EventsPage } from './EventsPage';
import { LocationsPage } from './LocationsPage';
import { SourcesPage } from './SourcesPage';

const PAGES = {
  sources: { label: 'Источники', Component: SourcesPage },
  events: { label: 'События', Component: EventsPage },
  locations: { label: 'Площадки', Component: LocationsPage },
} as const;
type PageKey = keyof typeof PAGES;

const currentPage = (): PageKey => {
  const key = window.location.hash.replace(/^#\/?/, '');
  return key in PAGES ? (key as PageKey) : 'events';
};

function Login({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const { token } = await api<{ token: string }>('/auth/login', {
        method: 'POST',
        body: { email: form.get('email'), password: form.get('password') },
      });
      setToken(token);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Неверный email или пароль' : 'Ошибка сервера, смотрите логи api');
    }
  }

  return (
    <form className="login" onSubmit={submit}>
      <h1>В Переславле — админка</h1>
      <input name="email" type="email" placeholder="Email" autoComplete="username" required />
      <input name="password" type="password" placeholder="Пароль" autoComplete="current-password" required />
      {error && <div className="err">{error}</div>}
      <button className="primary" type="submit">Войти</button>
    </form>
  );
}

export function App() {
  const [authed, setAuthed] = useState(() => getToken() !== null);
  const [page, setPage] = useState<PageKey>(currentPage);

  useEffect(() => {
    const onHash = () => setPage(currentPage());
    const onUnauthorized = () => { setToken(null); setAuthed(false); };
    window.addEventListener('hashchange', onHash);
    window.addEventListener(UNAUTHORIZED, onUnauthorized);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener(UNAUTHORIZED, onUnauthorized);
    };
  }, []);

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  const { Component } = PAGES[page];
  return (
    <>
      <header className="bar">
        <strong>В Переславле</strong>
        <nav>
          {(Object.keys(PAGES) as PageKey[]).map((key) => (
            <a key={key} href={`#/${key}`} aria-current={key === page ? 'page' : undefined}>{PAGES[key].label}</a>
          ))}
        </nav>
        <button onClick={() => { setToken(null); setAuthed(false); }}>Выйти</button>
      </header>
      <main><Component /></main>
    </>
  );
}
