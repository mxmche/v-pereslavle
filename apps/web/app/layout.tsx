import type { ReactNode } from 'react';

export const metadata = {
  title: 'В Переславле — афиша событий',
  description: 'Предстоящие события Переславля-Залесского и района',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
