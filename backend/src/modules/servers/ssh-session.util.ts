import { Client, ConnectConfig } from 'ssh2';
import { ServerAuthType } from '../../entities/server.entity';

export interface SshAuthTarget {
  host: string;
  port: number;
  username: string;
  authType: ServerAuthType;
  credential: string;
  readyTimeout?: number;
}

export function runRemoteCommand(
  target: SshAuthTarget,
  command: string,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const conn = new Client();
    let stdout = '';
    let stderr = '';

    const connectConfig: ConnectConfig = {
      host: target.host,
      port: target.port || 22,
      username: target.username,
      readyTimeout: target.readyTimeout ?? 10000,
    };

    if (target.authType === ServerAuthType.PASSWORD) {
      connectConfig.password = target.credential;
    } else {
      connectConfig.privateKey = target.credential;
    }

    try {
      conn
        .on('ready', () => {
          conn.exec(command, (err, stream) => {
            if (err) {
              conn.end();
              resolve({ exitCode: -1, stdout, stderr: err.message });
              return;
            }

            stream.on('data', (data: Buffer) => {
              stdout += data.toString();
            });
            stream.stderr.on('data', (data: Buffer) => {
              stderr += data.toString();
            });
            stream.on('close', (code: number | null) => {
              conn.end();
              resolve({ exitCode: code ?? -1, stdout, stderr });
            });
          });
        })
        .on('error', (err: Error) => {
          resolve({ exitCode: -1, stdout, stderr: err.message });
        })
        .connect(connectConfig);
    } catch (error) {
      const err = error as Error;
      resolve({ exitCode: -1, stdout, stderr: err.message });
    }
  });
}
