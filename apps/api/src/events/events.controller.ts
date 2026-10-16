import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { buildPublicWhere } from './events-query';
import { toPublicEvent } from './public-event';

const publicSelect = {
  id: true, slug: true, title: true, description: true, startsAt: true, endsAt: true,
  locationText: true, priceFrom: true, priceTo: true, isFree: true, category: true,
  imageUrl: true, ticketUrl: true, updatedAt: true,
  location: { select: { slug: true, name: true, address: true, lat: true, lng: true } },
  sources: { select: { url: true, source: { select: { name: true, allowImages: true } } } },
} as const;

@Controller('events')
export class EventsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('category') category?: string,
    @Query('location') location?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const events = await this.prisma.event.findMany({
      where: buildPublicWhere({ from, to, category, location }),
      select: publicSelect,
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      take: Math.min(Number(limit) || 50, 200),
      skip: Number(offset) || 0,
    });
    return events.map(toPublicEvent);
  }

  @Get(':slug')
  async one(@Param('slug') slug: string) {
    const event = await this.prisma.event.findFirst({ where: { slug, status: { in: ['PUBLISHED', 'ARCHIVED'] } }, select: publicSelect });
    if (!event) throw new NotFoundException();
    return toPublicEvent(event);
  }
}
