import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.location.findMany({
      select: { slug: true, name: true, address: true, lat: true, lng: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get(':slug')
  async one(@Param('slug') slug: string) {
    const location = await this.prisma.location.findUnique({
      where: { slug },
      select: { slug: true, name: true, address: true, lat: true, lng: true, aliases: true },
    });
    if (!location) throw new NotFoundException();
    return location;
  }
}
