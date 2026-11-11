import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramChannel } from './channels/telegram.channel';

export interface DeploymentAlertPayload {
  deploymentId: string;
  status: string;
  branch: string;
  totalServers: number;
  successfulServers: number;
  failedServers: number;
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);

  constructor(
    private readonly telegram: TelegramChannel,
    private readonly configService: ConfigService,
  ) {}

  async notifyDeploymentFinished(payload: DeploymentAlertPayload): Promise<void> {
    const emoji =
      payload.status === 'success'
        ? '✅'
        : payload.status === 'rolled_back'
          ? '♻️'
          : '❌';

    const message = [
      `${emoji} <b>RemoteFleet Deployment</b>`,
      `ID: <code>${payload.deploymentId}</code>`,
      `Branch: <code>${payload.branch}</code>`,
      `Status: <b>${payload.status.toUpperCase()}</b>`,
      `Servers: ${payload.successfulServers}/${payload.totalServers} ok, ${payload.failedServers} failed`,
    ].join('\n');

    await this.telegram.send(message);
    await this.dispatchDiscord(message.replace(/<\/?[^>]+>/g, ''));
  }

  private async dispatchDiscord(plainText: string): Promise<void> {
    const webhookUrl = this.configService.get<string>('DISCORD_WEBHOOK_URL');
    if (!webhookUrl) {
      return;
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: plainText }),
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Không gửi được Discord: ${err.message}`);
    }
  }
}
