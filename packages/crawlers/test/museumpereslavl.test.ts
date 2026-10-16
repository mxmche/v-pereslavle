import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseExhibitionDetail, parseTemporaryExhibitionLinks } from '../src/museumpereslavl';
import { parseDottedDateRange } from '../src/dates';

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');

test('parseDottedDateRange handles museum formats', () => {
  const r = parseDottedDateRange('19.06.26 9:00 - 08.11.26 9:00');
  assert.equal(r?.startsAt.toISOString(), '2026-06-19T06:00:00.000Z');
  assert.equal(r?.endsAt?.toISOString(), '2026-11-08T06:00:00.000Z');
  assert.equal(parseDottedDateRange('05.03.2027')?.startsAt.toISOString(), '2027-03-04T21:00:00.000Z');
  assert.equal(parseDottedDateRange('нет даты'), null);
});

test('parseTemporaryExhibitionLinks takes only the temporary exhibitions block', () => {
  const links = parseTemporaryExhibitionLinks(fixture('museumpereslavl-home.html'), 'https://museumpereslavl.ru/');
  assert.equal(links.length, 5);
  assert.equal(
    links[0],
    'https://museumpereslavl.ru/ru/museum/exhibition/detail/a1d6ab48-b682-11f1-9b15-55a88fa2d635/',
  );
});

test('parseExhibitionDetail extracts event from saved page', () => {
  const url = 'https://museumpereslavl.ru/ru/museum/exhibition/detail/366cfce3-648b-11f1-8421-55a88fa2d635/';
  const e = parseExhibitionDetail(fixture('museumpereslavl-exhibition.html'), url);
  assert.ok(e);
  assert.equal(e.title, '«Д.Н. Кардовский – художник, педагог»');
  assert.equal(e.externalId, '/ru/museum/exhibition/detail/366cfce3-648b-11f1-8421-55a88fa2d635/');
  assert.equal(e.startsAt.toISOString(), '2026-06-19T06:00:00.000Z');
  assert.equal(e.endsAt?.toISOString(), '2026-11-08T06:00:00.000Z');
  assert.equal(e.locationText, 'Ростовская 10');
  assert.ok(e.description?.startsWith('Выставка к 160-летнему юбилею'));
  assert.ok(!e.description?.includes('Справки по тел'));
  assert.ok(e.imageUrl?.startsWith('https://museumpereslavl.ru/pz-museum_opencms/'));
});
