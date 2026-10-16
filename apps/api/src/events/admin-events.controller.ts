import { Body, Controller, Get, NotFoundException, Param, Patch, Query, UseGuards } from '@nestjs/common';
import type { EventStatus } from '@vp/db';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma.service';

const STATUSES: EventStatus[] = ['DRAFT', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];

interface EventPatch {
  title?: string;
  description?: string | null;
  startsAt?: string;
  endsAt?: string | null;
  locationId?: string | null;
  locationText?: string | null;
  category?: string;
  imageUrl?: string | null;
  ticketUrl?: string | null;
  isFree?: boolean | null;
  priceFrom?: number | null;
  priceTo?: number | null;
  status?: EventStatus;
}

@Controller('admin/events')
@UseGuards(AdminGuard)
export class AdminEventsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Query('status') status?: string, @Query('q') q?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.prisma.event.findMany({
      where: {
        ...(STATUSES.includes(status as EventStatus) ? { status: status as EventStatus } : {}),
        ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
      },
      include: { location: { select: { slug: true, name: true } }, sources: { select: { url: true, source: { select: { name: true } } } } },
      orderBy: [{ startsAt: 'desc' }, { id: 'asc' }],
      take: Math.min(Number(limit) || 50, 200),
      skip: Number(offset) || 0,
    });
  }

  @Get(':id')
  async one(@Param('id') id: string) {
    const event = await this.prisma.event.findUnique({ where: { id }, include: { location: true, sources: { include: { source: true } } } });
    if (!event) throw new NotFoundException();
    return event;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: EventPatch) {
    const { startsAt, endsAt, status, ...rest } = body;
    return this.prisma.event.update({
      where: { id },
      data: {
        ...rest,
        ...(status && STATUSES.includes(status) ? { status } : {}),
        ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
        ...(endsAt !== undefined ? { endsAt: endsAt ? new Date(endsAt) : null } : {}),
      },
    });
  }
}
