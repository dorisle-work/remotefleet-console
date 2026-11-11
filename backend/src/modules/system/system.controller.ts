import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, ServerStatus } from '../../entities/server.entity';
import { Deployment } from '../../entities/deployment.entity';

@Controller('api/v1/system')
export class SystemController {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Server)
    private readonly serversRepo: Repository<Server>,
    @InjectRepository(Deployment)
    private readonly deploymentsRepo: Repository<Deployment>,
  ) {}

  @Get('status')
  async status() {
    const [totalServers, idle, deploying, offline, error, deployments] =
      await Promise.all([
        this.serversRepo.count(),
        this.serversRepo.count({ where: { status: ServerStatus.IDLE } }),
        this.serversRepo.count({ where: { status: ServerStatus.DEPLOYING } }),
        this.serversRepo.count({ where: { status: ServerStatus.OFFLINE } }),
        this.serversRepo.count({ where: { status: ServerStatus.ERROR } }),
        this.deploymentsRepo.count(),
      ]);

    return {
      service: 'remotefleet-backend',
      healthCheckCronEnabled:
        this.configService.get<string>('HEALTH_CHECK_CRON_ENABLED', 'true') ===
        'true',
      healthCheckCron: '*/5 * * * *',
      alerting: {
        telegramConfigured: Boolean(
          this.configService.get<string>('TELEGRAM_BOT_TOKEN') &&
            !String(
              this.configService.get<string>('TELEGRAM_BOT_TOKEN'),
            ).includes('ABCdef'),
        ),
        discordConfigured: Boolean(
          this.configService.get<string>('DISCORD_WEBHOOK_URL'),
        ),
      },
      fleet: {
        totalServers,
        idle,
        deploying,
        offline,
        error,
        deployments,
      },
    };
  }
}
