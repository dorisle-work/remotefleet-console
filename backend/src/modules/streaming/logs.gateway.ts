import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LogBroadcasterService } from './log-broadcaster.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LogsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  private readonly logger = new Logger(LogsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly broadcaster: LogBroadcasterService) {}

  onModuleInit(): void {
    this.broadcaster.events$.subscribe(({ channel, chunk }) => {
      this.server.to(channel).emit('log', chunk);
    });
  }

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channel: string },
  ): void {
    if (!payload?.channel) {
      return;
    }
    client.join(payload.channel);
    this.logger.debug(`Client ${client.id} joined ${payload.channel}`);
  }

  broadcast(channel: string, chunk: string): void {
    this.broadcaster.emit(channel, chunk);
    this.server.to(channel).emit('log', chunk);
  }
}
