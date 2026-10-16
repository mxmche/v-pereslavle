import * as cheerio from 'cheerio';
import { ofetch } from 'ofetch';
import { parseDottedDateRange } from './dates';
import type { CrawlerAdapter, ParsedEvent, SourceInput } from './types';

const DEFAULT_URL = 'https://museumpereslavl.ru/';
const USER_AGENT = 'VPereslavleBot/0.1 (+https://github.com/v-pereslavle)';
const REQUEST_DELAY_MS = 1000; // ≤1 rps per domain

/** Home page → detail URLs from the «Временные выставки» block. */
export function parseTemporaryExhibitionLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const urls = new Set<string>();
  $('.headline h3').each((_, h) => {
    if ($(h).text().trim() !== 'Временные выставки') return;
    $(h).closest('div.headline').nextAll('.event-list_1').first().find('a.event-item-title').each((_, a) => {
      const href = $(a).attr('href');
      if (href) urls.add(new URL(href, baseUrl).toString());
    });
  });
  return [...urls];
}

/** Exhibition detail page → event. Returns null when the date range can't be parsed. */
export function parseExhibitionDetail(html: string, url: string): ParsedEvent | null {
  const $ = cheerio.load(html);
  const root = $('.event-detail').first();
  const title = root.find('.event-top h3').first().text().replace(/\s+/g, ' ').trim();
  const dates = parseDottedDateRange(root.find('.news-date').first().text());
  if (!title || !dates) return null;

  const description = root
    .find('.information .col-md-9 > div > p')
    .map((_, p) => $(p).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter((t) => t && !t.startsWith('Справки по тел'))
    .join('\n\n');
  const location = root.find('.event-location').text().replace(/^[\s\S]*?Место проведения\s*:/, '').replace(/\s+/g, ' ').trim();
  const img = root.find('.information img').first().attr('src');

  return {
    kind: 'event',
    externalId: new URL(url).pathname,
    url,
    title,
    description: description || undefined,
    startsAt: dates.startsAt,
    endsAt: dates.endsAt,
    locationText: location || undefined,
    imageUrl: img ? new URL(img, url).toString() : undefined,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const get = (url: string) =>
  ofetch<string, 'text'>(url, { headers: { 'User-Agent': USER_AGENT }, responseType: 'text', retry: 2, timeout: 20_000 });

export const museumPereslavlAdapter: CrawlerAdapter = {
  key: 'html-museumpereslavl',

  async fetch(source: SourceInput) {
    const listUrl = typeof source.config.listUrl === 'string' ? source.config.listUrl : DEFAULT_URL;
    const links = parseTemporaryExhibitionLinks(await get(listUrl), listUrl);
    const events: ParsedEvent[] = [];
    for (const link of links) {
      await sleep(REQUEST_DELAY_MS);
      const event = parseExhibitionDetail(await get(link), link);
      if (event) events.push(event);
    }
    return events;
  },
};
