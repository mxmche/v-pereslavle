import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminGuard } from './auth/admin.guard';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AdminEventsController } from './events/admin-events.controller';
import { EventsController } from './events/events.controller';
import { AdminLocationsController } from './locations/admin-locations.controller';
import { LocationsController } from './locations/locations.controller';
import { CrawlQueue } from './crawl/crawl-queue.service';
import { IngestService } from './crawl/ingest.service';
import { PrismaService } from './prisma.service';
import { HealthController } from './health/health.controller';
import { SourcesController } from './sources/sources.controller';
import { SourcesScheduler } from './sources/sources.scheduler';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [
    HealthController, AuthController, SourcesController,
    EventsController, LocationsController, AdminEventsController, AdminLocationsController,
  ],
  providers: [AuthService, AdminGuard, PrismaService, IngestService, CrawlQueue, SourcesScheduler],
})
export class AppModule {}
