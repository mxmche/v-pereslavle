import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import type { Prisma } from '@vp/db';
import { PrismaService } from '../prisma.service';

// TODO: guard with admin JWT auth
@Controller('admin/sources')
export class SourcesController {
  constructor(private readonly prisma: PrismaService) {}

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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.source.delete({ where: { id } });
  }
}
