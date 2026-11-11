import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ServerHealthService } from './server-health.service';

@Injectable()
export class HealthSchedulerService {
  private readonly logger = new Logger(HealthSchedulerService.name);
  private readonly enabled: boolean;
  private running = false;

  constructor(
    private readonly healthService: ServerHealthService,
    private readonly configService: ConfigService,
  ) {
    this.enabled =
      this.configService.get<string>('HEALTH_CHECK_CRON_ENABLED', 'true') ===
      'true';
    if (this.enabled) {
      this.logger.log('Scheduled health checks enabled (every 5 minutes)');
    } else {
      this.logger.warn('Scheduled health checks disabled');
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'fleet-health-check' })
  async handleCron(): Promise<void> {
    if (!this.enabled || this.running) {
      return;
    }

    this.running = true;
    try {
      const results = await this.healthService.checkMany();
      const online = results.filter((item) => item.ok).length;
      this.logger.log(
        `Scheduled health check: ${online}/${results.length} online`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Scheduled health check failed: ${err.message}`);
    } finally {
      this.running = false;
    }
  }
}
