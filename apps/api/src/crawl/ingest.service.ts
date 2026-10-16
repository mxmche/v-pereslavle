import { createHash, randomBytes } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { getAdapter, type ParsedEvent, type ParsedPost } from '@vp/crawlers';
import { PrismaService } from '../prisma.service';
import { excerpt } from './excerpt';
import { slugify } from './slug';

export interface IngestResult {
  runId: string;
  found: number;
  created: number;
  updated: number;
}

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Crawls one source and upserts results; always records a CrawlRun and the source's last status. */
  async runSource(sourceId: string): Promise<IngestResult> {
    const source = await this.prisma.source.findUniqueOrThrow({ where: { id: sourceId } });
    const run = await this.prisma.crawlRun.create({ data: { sourceId, status: 'RUNNING' } });
    const stats = { found: 0, created: 0, updated: 0 };

    try {
      const adapter = getAdapter(source.adapter);
      if (!adapter) throw new Error(`No adapter registered for "${source.adapter}"`);

      const items = await adapter.fetch({
        id: source.id,
        url: source.url,
        adapter: source.adapter,
        config: (source.config ?? {}) as Record<string, unknown>,
      });
      stats.found = items.length;

      for (const item of items) {
        const created = item.kind === 'event' ? await this.upsertEvent(sourceId, item) : await this.upsertPost(sourceId, item);
        if (created) stats.created++;
        else stats.updated++;
      }

      await this.finish(run.id, sourceId, 'OK', stats);
      this.logger.log(`${source.name}: found ${stats.found}, created ${stats.created}, updated ${stats.updated}`);
      return { runId: run.id, ...stats };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.finish(run.id, sourceId, 'ERROR', stats, message);
      this.logger.error(`${source.name}: ${message}`);
      throw err;
    }
  }

  private async finish(runId: string, sourceId: string, status: 'OK' | 'ERROR', stats: Omit<IngestResult, 'runId'>, error?: string) {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.crawlRun.update({ where: { id: runId }, data: { status, finishedAt: now, error, ...stats } }),
      this.prisma.source.update({ where: { id: sourceId }, data: { lastRunAt: now, lastStatus: status, lastError: error ?? null } }),
    ]);
  }

  /** Returns true when a new Event was created, false when an existing one was updated. */
  private async upsertEvent(sourceId: string, item: ParsedEvent): Promise<boolean> {
    const fields = {
      title: item.title,
      description: excerpt(item.description),
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      locationText: item.locationText,
      imageUrl: item.imageUrl,
    };
    const existing = await this.prisma.eventSource.findUnique({
      where: { sourceId_externalId: { sourceId, externalId: item.externalId } },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.event.update({ where: { id: existing.eventId }, data: fields }),
        this.prisma.eventSource.update({ where: { id: existing.id }, data: { url: item.url } }),
      ]);
      return false;
    }

    await this.prisma.event.create({
      data: {
        ...fields,
        slug: `${slugify(item.title)}-${randomBytes(3).toString('hex')}`,
        // new events wait for a moderator to publish them in the admin
        status: 'DRAFT',
        sources: { create: { sourceId, externalId: item.externalId, url: item.url } },
      },
    });
    return true;
  }

  private async upsertPost(sourceId: string, item: ParsedPost): Promise<boolean> {
    const textHash = createHash('sha256').update(item.text.trim().toLowerCase().replace(/\s+/g, ' ')).digest('hex');
    const key = { sourceId_externalId: { sourceId, externalId: item.externalId } };
    const existing = await this.prisma.rawPost.findUnique({ where: key });
    if (existing) {
      // text changed → send through the pipeline again
      if (existing.textHash !== textHash) {
        await this.prisma.rawPost.update({ where: key, data: { text: item.text, textHash, url: item.url, status: 'NEW' } });
      }
      return false;
    }
    await this.prisma.rawPost.create({
      data: { sourceId, externalId: item.externalId, url: item.url, text: item.text, textHash, publishedAt: item.publishedAt },
    });
    return true;
  }
}
