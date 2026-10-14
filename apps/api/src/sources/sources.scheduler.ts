import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';

const DEFAULT_INTERVAL_MS = 3 * 60 * 60 * 1000;

@Injectable()
export class SourcesScheduler {
  private readonly logger = new Logger(SourcesScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Ticks every 5 min and picks sources whose interval has elapsed. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async tick() {
    // TODO: honour per-source scheduleCron; enqueue to pg-boss instead of logging
    const due = await this.prisma.source.findMany({
      where: {
        enabled: true,
        OR: [{ lastRunAt: null }, { lastRunAt: { lt: new Date(Date.now() - DEFAULT_INTERVAL_MS) } }],
      },
    });
    for (const source of due) this.logger.log(`Due for crawl: ${source.name}`);
  }
}
