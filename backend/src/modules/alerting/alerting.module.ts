import { Module } from '@nestjs/common';
import { AlertingService } from './alerting.service';
import { TelegramChannel } from './channels/telegram.channel';

@Module({
  providers: [AlertingService, TelegramChannel],
  exports: [AlertingService],
})
export class AlertingModule {}
