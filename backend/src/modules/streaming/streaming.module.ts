import { Module } from '@nestjs/common';
import { LogsGateway } from './logs.gateway';
import { LogBroadcasterService } from './log-broadcaster.service';

@Module({
  providers: [LogsGateway, LogBroadcasterService],
  exports: [LogsGateway, LogBroadcasterService],
})
export class StreamingModule {}
