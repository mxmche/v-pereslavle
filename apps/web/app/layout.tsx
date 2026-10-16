import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from './lib/api';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'В Переславле — афиша событий', template: '%s — В Переславле' },
  description: 'Предстоящие события Переславля-Залесского и района: концерты, выставки, экскурсии, фестивали',
  openGraph: { siteName: 'В Переславле', locale: 'ru_RU', type: 'website' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <header className="site-header">
          <div className="wrap">
            <a className="logo" href="/">В <span>Переславле</span></a>
            <nav><a href="/">Афиша</a></nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
