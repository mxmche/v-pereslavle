import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
import { HealthController } from './health/health.controller';
import { SourcesController } from './sources/sources.controller';
import { SourcesScheduler } from './sources/sources.scheduler';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [HealthController, SourcesController],
  providers: [PrismaService, SourcesScheduler],
})
export class AppModule {}
