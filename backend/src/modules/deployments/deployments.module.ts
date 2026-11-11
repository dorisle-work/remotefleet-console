import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deployment } from '../../entities/deployment.entity';
import { DeploymentTarget } from '../../entities/deployment-target.entity';
import { DeploymentLog } from '../../entities/deployment-log.entity';
import { Server } from '../../entities/server.entity';
import { ServersModule } from '../servers/servers.module';
import { StreamingModule } from '../streaming/streaming.module';
import { AlertingModule } from '../alerting/alerting.module';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';
import { DeploymentRunnerService } from './deployment-runner.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Deployment,
      DeploymentTarget,
      DeploymentLog,
      Server,
    ]),
    ServersModule,
    StreamingModule,
    AlertingModule,
  ],
  controllers: [DeploymentsController],
  providers: [DeploymentsService, DeploymentRunnerService],
})
export class DeploymentsModule {}
