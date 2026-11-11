import { Injectable, Logger } from '@nestjs/common';
import { Client, ConnectConfig } from 'ssh2';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LogsGateway } from '../streaming/logs.gateway';
import { ServerAuthType } from '../../entities/server.entity';

export interface ServerConnectionConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: ServerAuthType;
  credential: string;
  appDirectory: string;
}

export type LogChunkHandler = (
  streamType: 'stdout' | 'stderr' | 'system',
  chunk: string,
) => void;

@Injectable()
export class DeploymentRunnerService {
  private readonly logger = new Logger(DeploymentRunnerService.name);
  private readonly deployScript: string;

  constructor(private readonly logsGateway: LogsGateway) {
    const scriptPath = join(
      __dirname,
      '..',
      '..',
      'scripts',
      'deploy-template.sh',
    );
    this.deployScript = readFileSync(scriptPath, 'utf8');
  }

  buildRemoteCommand(
    appDirectory: string,
    targetBranch: string,
    deploymentId: string,
    dbName = 'production_db',
  ): string {
    const encoded = Buffer.from(this.deployScript).toString('base64');
    return [
      `echo '${encoded}' | base64 -d > /tmp/remotefleet-deploy-${deploymentId}.sh`,
      `chmod +x /tmp/remotefleet-deploy-${deploymentId}.sh`,
      `bash /tmp/remotefleet-deploy-${deploymentId}.sh '${appDirectory}' '${targetBranch}' '${dbName}' '${deploymentId}'`,
    ].join(' && ');
  }

  async executeOnServer(
    deploymentId: string,
    server: ServerConnectionConfig,
    scriptCommand: string,
    onLog?: LogChunkHandler,
  ): Promise<{ exitCode: number; finalStatus: string }> {
    return new Promise((resolve) => {
      const conn = new Client();
      const channel = `deployment:${deploymentId}:${server.id}`;

      const emit = (
        streamType: 'stdout' | 'stderr' | 'system',
        chunk: string,
      ) => {
        this.logsGateway.broadcast(channel, chunk);
        onLog?.(streamType, chunk);
      };

      emit(
        'system',
        `\x1b[36m[SYSTEM] Đang thiết lập kết nối SSH tới ${server.name} (${server.host})...\x1b[0m\n`,
      );

      const connectConfig: ConnectConfig = {
        host: server.host,
        port: server.port || 22,
        username: server.username,
        readyTimeout: 15000,
      };

      if (server.authType === ServerAuthType.PASSWORD) {
        connectConfig.password = server.credential;
      } else {
        connectConfig.privateKey = server.credential;
      }

      try {
        conn
          .on('ready', () => {
            emit(
              'system',
              `\x1b[32m[SYSTEM] Kết nối SSH thành công. Bắt đầu thực thi kịch bản...\x1b[0m\n\n`,
            );

            conn.exec(scriptCommand, { pty: true }, (err, stream) => {
              if (err) {
                conn.end();
                emit(
                  'system',
                  `\x1b[31m[ERROR] Không thể thực thi lệnh: ${err.message}\x1b[0m\n`,
                );
                resolve({ exitCode: -1, finalStatus: 'failed' });
                return;
              }

              stream.on('data', (data: Buffer) => {
                emit('stdout', data.toString());
              });

              stream.stderr.on('data', (data: Buffer) => {
                emit('stderr', `\x1b[31m${data.toString()}\x1b[0m`);
              });

              stream.on('close', (code: number | null) => {
                conn.end();
                const exitCode = code ?? -1;
                if (exitCode === 0) {
                  emit(
                    'system',
                    `\n\x1b[32m[SYSTEM] Hoàn tất triển khai trên ${server.name} (Exit Code: 0)\x1b[0m\n`,
                  );
                  resolve({ exitCode: 0, finalStatus: 'success' });
                } else {
                  emit(
                    'system',
                    `\n\x1b[31m[SYSTEM] Thất bại trên ${server.name} (Exit Code: ${exitCode}). Kịch bản rollback đã được kích hoạt!\x1b[0m\n`,
                  );
                  resolve({ exitCode, finalStatus: 'rolled_back' });
                }
              });
            });
          })
          .on('error', (err: Error) => {
            this.logger.error(`SSH error on ${server.name}: ${err.message}`);
            emit(
              'system',
              `\x1b[31m[ERROR] Lỗi kết nối SSH: ${err.message}\x1b[0m\n`,
            );
            resolve({ exitCode: -1, finalStatus: 'failed' });
          })
          .connect(connectConfig);
      } catch (error) {
        const err = error as Error;
        emit(
          'system',
          `\x1b[31m[ERROR] Lỗi kết nối SSH: ${err.message}\x1b[0m\n`,
        );
        resolve({ exitCode: -1, finalStatus: 'failed' });
      }
    });
  }
}
