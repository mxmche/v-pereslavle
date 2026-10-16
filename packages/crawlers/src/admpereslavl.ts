import * as cheerio from 'cheerio';
import { ofetch } from 'ofetch';
import { parseRuDateRange } from './dates';
import type { CrawlerAdapter, ParsedEvent, SourceInput } from './types';

const DEFAULT_BASE_URL = 'https://admpereslavl.ru';
const DEFAULT_DIVISION_ID = 365; // «Анонсы мероприятий»
const USER_AGENT = 'VPereslavleBot/0.1 (+https://github.com/v-pereslavle)';
const REQUEST_DELAY_MS = 1000; // ≤1 rps per domain

/** Month calendar fragment → day numbers that have announcements. */
export function parseMonthDays(html: string): number[] {
  const $ = cheerio.load(html);
  return $('td.have')
    .map((_, td) => Number($(td).attr('data-day')))
    .get()
    .filter((d) => d > 0);
}

/** Day fragment → announcement links with the day's date (midnight MSK). */
export function parseDayAnnouncements(html: string, baseUrl: string): { date: Date; title: string; url: string }[] {
  const $ = cheerio.load(html);
  const date = parseRuDateRange($('th').first().text())?.startsAt;
  if (!date) return [];
  return $('th a')
    .map((_, a) => ({
      date,
      title: $(a).text().replace(/\s+/g, ' ').trim(),
      url: new URL($(a).attr('href') ?? '', baseUrl).toString(),
    }))
    .get()
    .filter((x) => x.title && x.url !== baseUrl);
}

/** Announcement title is prefixed with the start time: "9:00 День …". */
export function splitTime(title: string): { title: string; minutes: number } {
  const m = /^(\d{1,2})[:.](\d{2})\s+(.+)$/.exec(title);
  return m ? { title: m[3], minutes: Number(m[1]) * 60 + Number(m[2]) } : { title, minutes: 0 };
}

/** Announcement page → description text (paragraphs under the h1). */
export function parseAnnouncementBody(html: string): string | undefined {
  const $ = cheerio.load(html);
  const text = $('.content > p')
    .map((_, p) => $(p).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter(Boolean)
    .join('\n\n');
  return text || undefined;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const post = (url: string, body?: Record<string, string | number>) =>
  ofetch<string, 'text'>(url, {
    method: 'POST',
    body: body ? new URLSearchParams(Object.entries(body).map(([k, v]) => [k, String(v)])) : undefined,
    headers: { 'User-Agent': USER_AGENT },
    responseType: 'text',
    retry: 2,
    timeout: 20_000,
  });
const get = (url: string) =>
  ofetch<string, 'text'>(url, { headers: { 'User-Agent': USER_AGENT }, responseType: 'text', retry: 2, timeout: 20_000 });

/**
 * admpereslavl.ru has no RSS; announcements live in a JS calendar backed by two
 * AJAX endpoints (month → days with events, day → links). The calendar API takes
 * no year, so the year comes from the day response and past items are dropped.
 */
export const admPereslavlAdapter: CrawlerAdapter = {
  key: 'html-admpereslavl',

  async fetch(source: SourceInput) {
    const base = typeof source.config.baseUrl === 'string' ? source.config.baseUrl : DEFAULT_BASE_URL;
    const divisionId = typeof source.config.divisionId === 'number' ? source.config.divisionId : DEFAULT_DIVISION_ID;
    const monthsAhead = typeof source.config.monthsAhead === 'number' ? source.config.monthsAhead : 3;
    const startOfToday = Date.now() - 24 * 3600_000;
    const events = new Map<string, ParsedEvent>();

    const now = new Date();
    for (let i = 0; i <= monthsAhead; i++) {
      const month = ((now.getUTCMonth() + i) % 12) + 1;
      const mm = String(month).padStart(2, '0');
      await sleep(REQUEST_DELAY_MS);
      const days = parseMonthDays(await post(`${base}/divisiontypes/date/ajax/date.php?m=${mm}&divisionid=${divisionId}`));
      for (const day of days) {
        await sleep(REQUEST_DELAY_MS);
        const dayHtml = await post(`${base}/divisiontypes/date/ajax/viewdates.php`, { day, month: mm, divisionid: divisionId });
        for (const a of parseDayAnnouncements(dayHtml, base)) {
          const { title, minutes } = splitTime(a.title);
          const startsAt = new Date(a.date.getTime() + minutes * 60_000);
          if (startsAt.getTime() < startOfToday) continue;
          const externalId = new URL(a.url).pathname;
          if (events.has(externalId)) continue;
          await sleep(REQUEST_DELAY_MS);
          const description = parseAnnouncementBody(await get(a.url));
          events.set(externalId, { kind: 'event', externalId, url: a.url, title, description, startsAt });
        }
      }
    }
    return [...events.values()];
  },
};
