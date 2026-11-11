import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { In, Repository } from 'typeorm';
import { Server, ServerStatus } from '../../entities/server.entity';
import { ServersService } from './servers.service';
import { runRemoteCommand } from './ssh-session.util';

export interface HealthCheckResult {
  serverId: string;
  name: string;
  ok: boolean;
  status: ServerStatus;
  cpuPercent: number | null;
  memPercent: number | null;
  diskPercent: number | null;
  message: string;
  checkedAt: string;
}

@Injectable()
export class ServerHealthService {
  private readonly logger = new Logger(ServerHealthService.name);
  private readonly healthScript: string;

  constructor(
    @InjectRepository(Server)
    private readonly serversRepo: Repository<Server>,
    private readonly serversService: ServersService,
  ) {
    const scriptPath = join(__dirname, '..', '..', 'scripts', 'health-check.sh');
    this.healthScript = readFileSync(scriptPath, 'utf8');
  }

  async checkOne(serverId: string): Promise<HealthCheckResult> {
    const { server, plaintextCredential } =
      await this.serversService.findWithCredential(serverId);

    if (server.status === ServerStatus.DEPLOYING) {
      return {
        serverId: server.id,
        name: server.name,
        ok: false,
        status: server.status,
        cpuPercent: server.cpuPercent,
        memPercent: server.memPercent,
        diskPercent: server.diskPercent,
        message: 'Đang deploy — bỏ qua health check',
        checkedAt: new Date().toISOString(),
      };
    }

    const encoded = Buffer.from(this.healthScript).toString('base64');
    const command = `echo '${encoded}' | base64 -d > /tmp/remotefleet-health.sh && bash /tmp/remotefleet-health.sh`;

    try {
      const remote = await runRemoteCommand(
        {
          host: server.ipAddress,
          port: server.sshPort,
          username: server.sshUser,
          authType: server.authType,
          credential: plaintextCredential,
          readyTimeout: 8000,
        },
        command,
      );

      const checkedAt = new Date();
      const metrics = this.parseMetrics(remote.stdout);

      if (remote.exitCode !== 0 || metrics.cpuPercent === null) {
        const message =
          remote.stderr.trim() ||
          remote.stdout.trim() ||
          'SSH health check thất bại';
        return this.markOffline(server.id, server.name, message, checkedAt);
      }

      await this.serversRepo.update(server.id, {
        status: ServerStatus.IDLE,
        lastHealthCheckAt: checkedAt,
        cpuPercent: metrics.cpuPercent,
        memPercent: metrics.memPercent,
        diskPercent: metrics.diskPercent,
        healthMessage: 'OK',
      });

      return {
        serverId: server.id,
        name: server.name,
        ok: true,
        status: ServerStatus.IDLE,
        cpuPercent: metrics.cpuPercent,
        memPercent: metrics.memPercent,
        diskPercent: metrics.diskPercent,
        message: 'OK',
        checkedAt: checkedAt.toISOString(),
      };
    } catch (error) {
      const err = error as Error;
      return this.markOffline(server.id, server.name, err.message, new Date());
    }
  }

  private async markOffline(
    serverId: string,
    name: string,
    message: string,
    checkedAt: Date,
  ): Promise<HealthCheckResult> {
    const trimmed = message.slice(0, 255);
    this.logger.warn(`Health check failed for ${name}: ${trimmed}`);

    await this.serversRepo.update(serverId, {
      status: ServerStatus.OFFLINE,
      lastHealthCheckAt: checkedAt,
      cpuPercent: null,
      memPercent: null,
      diskPercent: null,
      healthMessage: trimmed,
    });

    return {
      serverId,
      name,
      ok: false,
      status: ServerStatus.OFFLINE,
      cpuPercent: null,
      memPercent: null,
      diskPercent: null,
      message: trimmed,
      checkedAt: checkedAt.toISOString(),
    };
  }

  async checkMany(serverIds?: string[]): Promise<HealthCheckResult[]> {
    const servers =
      serverIds && serverIds.length > 0
        ? await this.serversRepo.find({ where: { id: In(serverIds) } })
        : await this.serversRepo.find();

    return Promise.all(servers.map((server) => this.checkOne(server.id)));
  }

  private parseMetrics(stdout: string): {
    cpuPercent: number | null;
    memPercent: number | null;
    diskPercent: number | null;
  } {
    const cpu = stdout.match(/cpu=(\d+)/)?.[1];
    const mem = stdout.match(/mem=(\d+)/)?.[1];
    const disk = stdout.match(/disk=(\d+)/)?.[1];

    return {
      cpuPercent: cpu !== undefined ? Number(cpu) : null,
      memPercent: mem !== undefined ? Number(mem) : null,
      diskPercent: disk !== undefined ? Number(disk) : null,
    };
  }
}
