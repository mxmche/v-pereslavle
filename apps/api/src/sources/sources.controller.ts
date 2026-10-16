import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { Prisma } from '@vp/db';
import { AdminGuard } from '../auth/admin.guard';
import { CrawlQueue } from '../crawl/crawl-queue.service';
import { PrismaService } from '../prisma.service';

@Controller('admin/sources')
@UseGuards(AdminGuard)
export class SourcesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: CrawlQueue,
  ) {}

  @Get()
  list() {
    return this.prisma.source.findMany({ orderBy: [{ priority: 'desc' }, { name: 'asc' }] });
  }

  @Post()
  create(@Body() data: Prisma.SourceCreateInput) {
    return this.prisma.source.create({ data });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.SourceUpdateInput) {
    return this.prisma.source.update({ where: { id }, data });
  }

  /** «Запустить сейчас»: same queue as the scheduler; queued=false if already queued or running. */
  @Post(':id/run')
  @HttpCode(202)
  async run(@Param('id') id: string) {
    await this.prisma.source.findUniqueOrThrow({ where: { id } });
    return { queued: this.queue.enqueue(id) };
  }

  @Get(':id/runs')
  runs(@Param('id') id: string) {
    return this.prisma.crawlRun.findMany({ where: { sourceId: id }, orderBy: { startedAt: 'desc' }, take: 50 });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.source.delete({ where: { id } });
  }
}
