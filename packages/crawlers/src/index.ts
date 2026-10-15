export interface SourceInput {
  id: string;
  url: string;
  adapter: string;
  config: Record<string, unknown>;
}

/** Structured item from a site with regular markup — goes straight to Event. */
export interface ParsedEvent {
  kind: 'event';
  externalId: string;
  url?: string;
  title: string;
  description?: string;
  startsAt: Date;
  endsAt?: Date;
  locationText?: string;
  imageUrl?: string;
}

/** Free-form post (VK/Telegram) — goes to RawPost for the LLM pipeline. */
export interface ParsedPost {
  kind: 'post';
  externalId: string;
  url?: string;
  text: string;
  publishedAt: Date;
}

export type RawItem = ParsedEvent | ParsedPost;

export interface CrawlerAdapter {
  key: string;
  fetch(source: SourceInput): Promise<RawItem[]>;
}

const registry = new Map<string, CrawlerAdapter>();

export function registerAdapter(adapter: CrawlerAdapter) {
  registry.set(adapter.key, adapter);
}

export function getAdapter(key: string): CrawlerAdapter | undefined {
  return registry.get(key);
}

export function listAdapters(): string[] {
  return [...registry.keys()];
}
