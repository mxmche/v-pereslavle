import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCalendarHtml } from '../src/tourismpereslavl';
import { parseRuDateRange } from '../src/dates';

test('parseRuDateRange handles calendar formats', () => {
  const iso = (s: string) => {
    const r = parseRuDateRange(s);
    return r && [r.startsAt.toISOString(), r.endsAt?.toISOString()];
  };
  assert.deepEqual(iso('31 июля 2027'), ['2027-07-30T21:00:00.000Z', undefined]);
  assert.deepEqual(iso('30-31 июля 2027'), ['2027-07-29T21:00:00.000Z', '2027-07-30T21:00:00.000Z']);
  assert.deepEqual(iso('31 июля - 2 августа 2026'), ['2026-07-30T21:00:00.000Z', '2026-08-01T21:00:00.000Z']);
  assert.deepEqual(iso('Январь 2027'), ['2026-12-31T21:00:00.000Z', undefined]);
  assert.deepEqual(iso('май-июнь 2027'), ['2027-04-30T21:00:00.000Z', '2027-06-29T21:00:00.000Z']);
  assert.deepEqual(iso('09 мая 2026'), ['2026-05-08T21:00:00.000Z', undefined]);
  assert.equal(parseRuDateRange('Круглый год'), null);
});

test('parseCalendarHtml extracts events from saved page', () => {
  const html = readFileSync(join(__dirname, 'fixtures/tourismpereslavl-calendar.html'), 'utf8');
  const { events, nextPage } = parseCalendarHtml(html, 'https://tourismpereslavl.ru/kalendar-turisticheskikh-sobytiy/');
  assert.equal(events.length, 21);
  assert.equal(nextPage, true);
  const first = events[0];
  assert.equal(first.title, 'Фестиваль воздухоплавания "Яблоки на снегу"');
  assert.equal(first.externalId, '/kalendar-turisticheskikh-sobytiy/yabloki-na-snegu/');
  assert.equal(first.url, 'https://tourismpereslavl.ru/kalendar-turisticheskikh-sobytiy/yabloki-na-snegu/');
  assert.ok(first.imageUrl?.startsWith('https://tourismpereslavl.ru/upload/'));
  assert.equal(new Set(events.map((e) => e.externalId)).size, 21);
});
