import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CronTime } from 'cron';
import { CrawlQueue } from '../crawl/crawl-queue.service';
import { PrismaService } from '../prisma.service';

const TIME_ZONE = 'Europe/Moscow';

/** A source is due when its next cron fire after the last run has already passed. */
export function isDue(scheduleCron: string, lastRunAt: Date | null, now = new Date()): boolean {
  if (!lastRunAt) return true;
  const next = new CronTime(scheduleCron, TIME_ZONE).getNextDateFrom(lastRunAt, TIME_ZONE);
  return next.toMillis() <= now.getTime();
}

@Injectable()
export class SourcesScheduler {
  private readonly logger = new Logger(SourcesScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: CrawlQueue,
  ) {}

  /** Ticks every 5 min and enqueues enabled sources whose scheduleCron has come due. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async tick() {
    const sources = await this.prisma.source.findMany({
      where: { enabled: true },
      orderBy: { priority: 'desc' },
    });
    for (const source of sources) {
      try {
        if (isDue(source.scheduleCron, source.lastRunAt) && this.queue.enqueue(source.id)) {
          this.logger.log(`Enqueued: ${source.name}`);
        }
      } catch (err) {
        this.logger.error(`Bad scheduleCron "${source.scheduleCron}" for ${source.name}: ${err}`);
      }
    }
  }
}
