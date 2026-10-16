import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseAnnouncementBody, parseDayAnnouncements, parseMonthDays, splitTime } from '../src/admpereslavl';

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');

test('parseMonthDays returns days marked as having announcements', () => {
  assert.deepEqual(parseMonthDays(fixture('admpereslavl-month.html')), [26, 29]);
});

test('parseDayAnnouncements extracts date and links', () => {
  const items = parseDayAnnouncements(fixture('admpereslavl-day.html'), 'https://admpereslavl.ru');
  assert.equal(items.length, 1);
  assert.equal(items[0].date.toISOString(), '2026-09-24T21:00:00.000Z');
  assert.equal(items[0].title, '9:00 День бесплатной юридической помощи');
  assert.equal(items[0].url, 'https://admpereslavl.ru/9-00-den-besplatnoy-yuridicheskoy-pomoschi-685982');
});

test('splitTime strips the time prefix', () => {
  assert.deepEqual(splitTime('9:00 День бесплатной юридической помощи'), { title: 'День бесплатной юридической помощи', minutes: 540 });
  assert.deepEqual(splitTime('Без времени'), { title: 'Без времени', minutes: 0 });
});

test('parseAnnouncementBody joins paragraphs', () => {
  const body = parseAnnouncementBody(fixture('admpereslavl-event.html'));
  assert.ok(body?.startsWith('25 сентября в общественной приёмной'));
  assert.ok(body?.includes('ул. Советская, 5'));
});
