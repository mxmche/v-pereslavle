import * as cheerio from 'cheerio';
import { ofetch } from 'ofetch';
import { parseRuDateRange } from './dates';
import type { CrawlerAdapter, ParsedEvent, SourceInput } from './types';

const DEFAULT_LIST_URL = 'https://tourismpereslavl.ru/kalendar-turisticheskikh-sobytiy/';
const USER_AGENT = 'VPereslavleBot/0.1 (+https://github.com/v-pereslavle)';
const PAGE_DELAY_MS = 1000; // ≤1 rps per domain

/** Pure parser: calendar page HTML → events. Items with unparsable dates are dropped. */
export function parseCalendarHtml(html: string, baseUrl: string): { events: ParsedEvent[]; nextPage: boolean } {
  const $ = cheerio.load(html);
  const events: ParsedEvent[] = [];

  $('.attractions-list .item').each((_, el) => {
    const item = $(el);
    const nameLink = item.find('a.name').first();
    const href = nameLink.attr('href');
    const title = nameLink.text().replace(/\s+/g, ' ').trim();
    const dates = parseRuDateRange(item.find('a.date').first().text());
    if (!href || !title || !dates) return;

    const url = new URL(href, baseUrl);
    const img = item.find('img').first().attr('src');
    const description = item.children('p').first().text().replace(/\s+/g, ' ').trim();

    events.push({
      kind: 'event',
      externalId: url.pathname,
      url: url.toString(),
      title,
      description: description || undefined,
      startsAt: dates.startsAt,
      endsAt: dates.endsAt,
      imageUrl: img ? new URL(img, baseUrl).toString() : undefined,
    });
  });

  return { events, nextPage: $('a[href*="PAGEN_"]').length > 0 };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const tourismPereslavlAdapter: CrawlerAdapter = {
  key: 'html-tourismpereslavl',

  async fetch(source: SourceInput) {
    const listUrl = typeof source.config.listUrl === 'string' ? source.config.listUrl : DEFAULT_LIST_URL;
    const maxPages = typeof source.config.maxPages === 'number' ? source.config.maxPages : 5;
    const seen = new Map<string, ParsedEvent>();

    for (let page = 1; page <= maxPages; page++) {
      const url = page === 1 ? listUrl : `${listUrl}?PAGEN_2=${page}`;
      const html = await ofetch<string, 'text'>(url, {
        headers: { 'User-Agent': USER_AGENT },
        responseType: 'text',
        retry: 2,
        timeout: 20_000,
      });
      const { events } = parseCalendarHtml(html, listUrl);
      const before = seen.size;
      for (const e of events) seen.set(e.externalId, e);
      if (events.length === 0 || seen.size === before) break; // empty or repeated page → done
      if (page < maxPages) await sleep(PAGE_DELAY_MS);
    }
    return [...seen.values()];
  },
};
