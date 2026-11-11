import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VaultModule } from './modules/vault/vault.module';
import { ServersModule } from './modules/servers/servers.module';
import { DeploymentsModule } from './modules/deployments/deployments.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { AlertingModule } from './modules/alerting/alerting.module';
import { AuthModule } from './modules/auth/auth.module';
import { SystemModule } from './modules/system/system.module';
import { AuthGuard } from './common/guards/auth.guard';
import { HealthController } from './health.controller';
import { Server } from './entities/server.entity';
import { ServerCredential } from './entities/server-credential.entity';
import { Deployment } from './entities/deployment.entity';
import { DeploymentTarget } from './entities/deployment-target.entity';
import { DeploymentLog } from './entities/deployment-log.entity';
import { Operator } from './entities/operator.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER', 'remotefleet'),
        password: config.get<string>('DB_PASSWORD', 'Secret_DB_Password_2026'),
        database: config.get<string>('DB_NAME', 'remotefleet_db'),
        entities: [
          Server,
          ServerCredential,
          Deployment,
          DeploymentTarget,
          DeploymentLog,
          Operator,
        ],
        synchronize: config.get<string>('DB_SYNC', 'true') === 'true',
      }),
    }),
    AuthModule,
    VaultModule,
    ServersModule,
    DeploymentsModule,
    StreamingModule,
    AlertingModule,
    SystemModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
