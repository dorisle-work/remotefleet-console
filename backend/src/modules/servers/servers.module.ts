import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from '../../entities/server.entity';
import { ServerCredential } from '../../entities/server-credential.entity';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';
import { ServerHealthService } from './server-health.service';
import { HealthSchedulerService } from './health-scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([Server, ServerCredential])],
  controllers: [ServersController],
  providers: [ServersService, ServerHealthService, HealthSchedulerService],
  exports: [ServersService, ServerHealthService],
})
export class ServersModule {}
