import type { CrawlerAdapter } from './types';

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
