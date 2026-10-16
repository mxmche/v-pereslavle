import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma.service';

@Controller('admin/locations')
@UseGuards(AdminGuard)
export class AdminLocationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.location.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { events: true } } } });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; aliases?: string[]; address?: string | null; lat?: number | null; lng?: number | null }) {
    const { name, aliases, address, lat, lng } = body;
    return this.prisma.location.update({ where: { id }, data: { name, aliases, address, lat, lng } });
  }
}
