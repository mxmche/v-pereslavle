import { Injectable, Logger } from '@nestjs/common';
import { IngestService } from './ingest.service';

const CONCURRENCY = 2;

/**
 * In-process queue: dedupes by sourceId and limits concurrent crawls.
 * Stand-in for pg-boss (plan) — same enqueue() contract, so it can be swapped later.
 */
@Injectable()
export class CrawlQueue {
  private readonly logger = new Logger(CrawlQueue.name);
  private readonly pending: string[] = [];
  private readonly active = new Set<string>();

  constructor(private readonly ingest: IngestService) {}

  /** Returns false if this source is already queued or running. */
  enqueue(sourceId: string): boolean {
    if (this.active.has(sourceId) || this.pending.includes(sourceId)) return false;
    this.pending.push(sourceId);
    this.drain();
    return true;
  }

  isBusy(sourceId: string): boolean {
    return this.active.has(sourceId) || this.pending.includes(sourceId);
  }

  private drain() {
    while (this.active.size < CONCURRENCY && this.pending.length > 0) {
      const sourceId = this.pending.shift()!;
      this.active.add(sourceId);
      this.ingest
        .runSource(sourceId)
        .catch((err) => this.logger.warn(`Crawl ${sourceId} failed: ${err instanceof Error ? err.message : err}`))
        .finally(() => {
          this.active.delete(sourceId);
          this.drain();
        });
    }
  }
}
