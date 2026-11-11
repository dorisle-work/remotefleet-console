import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  Deployment,
  DeploymentStatus,
} from '../../entities/deployment.entity';
import {
  DeploymentTarget,
  DeploymentTargetStatus,
} from '../../entities/deployment-target.entity';
import {
  DeploymentLog,
  LogStreamType,
} from '../../entities/deployment-log.entity';
import { ServerStatus } from '../../entities/server.entity';
import { ServersService } from '../servers/servers.service';
import { AlertingService } from '../alerting/alerting.service';
import { DeploymentRunnerService } from './deployment-runner.service';
import { TriggerDeploymentDto } from './dto/trigger-deployment.dto';
import { Server } from '../../entities/server.entity';

@Injectable()
export class DeploymentsService {
  private readonly logger = new Logger(DeploymentsService.name);

  constructor(
    @InjectRepository(Deployment)
    private readonly deploymentsRepo: Repository<Deployment>,
    @InjectRepository(DeploymentTarget)
    private readonly targetsRepo: Repository<DeploymentTarget>,
    @InjectRepository(DeploymentLog)
    private readonly logsRepo: Repository<DeploymentLog>,
    @InjectRepository(Server)
    private readonly serversRepo: Repository<Server>,
    private readonly serversService: ServersService,
    private readonly runner: DeploymentRunnerService,
    private readonly alerting: AlertingService,
  ) {}

  async findAll(): Promise<Deployment[]> {
    return this.deploymentsRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['targets', 'targets.server'],
      take: 50,
    });
  }

  async findOne(id: string, withLogs = true): Promise<Deployment> {
    const deployment = await this.deploymentsRepo.findOne({
      where: { id },
      relations: withLogs
        ? ['targets', 'targets.server', 'targets.logs']
        : ['targets', 'targets.server'],
    });
    if (!deployment) {
      throw new NotFoundException(`Deployment ${id} không tồn tại`);
    }
    return deployment;
  }

  async findTargetLogs(deploymentId: string, targetId: string) {
    const target = await this.targetsRepo.findOne({
      where: { id: targetId, deploymentId },
      relations: ['logs', 'server'],
    });
    if (!target) {
      throw new NotFoundException(
        `Deployment target #${targetId} không tồn tại`,
      );
    }
    return {
      target,
      logs: (target.logs ?? []).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      ),
    };
  }

  async trigger(dto: TriggerDeploymentDto): Promise<Deployment> {
    const servers = await this.serversRepo.find({
      where: { id: In(dto.serverIds) },
    });

    if (servers.length === 0) {
      throw new NotFoundException('Không tìm thấy server nào trong danh sách');
    }

    const deployment = this.deploymentsRepo.create({
      id: uuidv4(),
      initiatedBy: dto.initiatedBy ?? 'console-operator',
      targetBranch: dto.targetBranch,
      targetCommitHash: dto.targetCommitHash ?? null,
      status: DeploymentStatus.QUEUED,
      totalServers: servers.length,
      successfulServers: 0,
      failedServers: 0,
    });
    await this.deploymentsRepo.save(deployment);

    const targets = servers.map((server) =>
      this.targetsRepo.create({
        deploymentId: deployment.id,
        serverId: server.id,
        status: DeploymentTargetStatus.PENDING,
        previousCommit: server.currentCommit,
      }),
    );
    await this.targetsRepo.save(targets);

    void this.runDeployment(deployment.id, dto.dbName ?? 'production_db');

    return this.findOne(deployment.id);
  }

  private async runDeployment(
    deploymentId: string,
    dbName: string,
  ): Promise<void> {
    const deployment = await this.findOne(deploymentId, false);
    await this.deploymentsRepo.update(deploymentId, {
      status: DeploymentStatus.RUNNING,
    });
    deployment.status = DeploymentStatus.RUNNING;

    const results = await Promise.all(
      deployment.targets.map((target) =>
        this.runTarget(deployment, target, dbName),
      ),
    );

    const successful = results.filter((r) => r === 'success').length;
    const failed = results.length - successful;

    let finalStatus = DeploymentStatus.SUCCESS;
    if (failed === results.length) {
      finalStatus = DeploymentStatus.FAILED;
    } else if (failed > 0) {
      const hasRollback = results.includes('rolled_back');
      finalStatus = hasRollback
        ? DeploymentStatus.ROLLED_BACK
        : DeploymentStatus.FAILED;
    }

    deployment.status = finalStatus;
    deployment.successfulServers = successful;
    deployment.failedServers = failed;
    deployment.finishedAt = new Date();
    await this.deploymentsRepo.save(deployment);

    await this.alerting.notifyDeploymentFinished({
      deploymentId: deployment.id,
      status: finalStatus,
      branch: deployment.targetBranch,
      totalServers: deployment.totalServers,
      successfulServers: successful,
      failedServers: failed,
    });
  }

  private async runTarget(
    deployment: Deployment,
    target: DeploymentTarget,
    dbName: string,
  ): Promise<string> {
    await this.targetsRepo.update(target.id, {
      status: DeploymentTargetStatus.IN_PROGRESS,
      startedAt: new Date(),
    });

    await this.serversRepo.update(target.serverId, {
      status: ServerStatus.DEPLOYING,
    });

    try {
      const { server, plaintextCredential } =
        await this.serversService.findWithCredential(target.serverId);

      const command = this.runner.buildRemoteCommand(
        server.appDirectory,
        deployment.targetBranch,
        deployment.id,
        dbName,
      );

      const result = await this.runner.executeOnServer(
        deployment.id,
        {
          id: server.id,
          name: server.name,
          host: server.ipAddress,
          port: server.sshPort,
          username: server.sshUser,
          authType: server.authType,
          credential: plaintextCredential,
          appDirectory: server.appDirectory,
        },
        command,
        (streamType, chunk) => {
          void this.persistLog(
            target.id,
            streamType === 'stderr'
              ? LogStreamType.STDERR
              : streamType === 'system'
                ? LogStreamType.SYSTEM
                : LogStreamType.STDOUT,
            chunk,
          );
        },
      );

      await this.persistLog(
        target.id,
        LogStreamType.SYSTEM,
        `Exit code: ${result.exitCode}, status: ${result.finalStatus}`,
      );

      if (result.finalStatus === 'success') {
        await this.targetsRepo.update(target.id, {
          status: DeploymentTargetStatus.SUCCESS,
          exitCode: 0,
          finishedAt: new Date(),
        });
        await this.serversRepo.update(server.id, {
          status: ServerStatus.IDLE,
          currentCommit: deployment.targetCommitHash,
        });
      } else if (result.finalStatus === 'rolled_back') {
        await this.targetsRepo.update(target.id, {
          status: DeploymentTargetStatus.ROLLED_BACK,
          exitCode: result.exitCode,
          errorMessage: 'Deploy failed; auto-rollback executed',
          finishedAt: new Date(),
        });
        await this.serversRepo.update(server.id, {
          status: ServerStatus.ERROR,
        });
      } else {
        await this.targetsRepo.update(target.id, {
          status: DeploymentTargetStatus.FAILED,
          exitCode: result.exitCode,
          errorMessage: 'SSH or remote execution failed',
          finishedAt: new Date(),
        });
        await this.serversRepo.update(server.id, {
          status: ServerStatus.ERROR,
        });
      }

      return result.finalStatus;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Target ${target.id} failed: ${err.message}`);
      await this.targetsRepo.update(target.id, {
        status: DeploymentTargetStatus.FAILED,
        errorMessage: err.message,
        exitCode: -1,
        finishedAt: new Date(),
      });
      await this.serversRepo.update(target.serverId, {
        status: ServerStatus.ERROR,
      });
      return 'failed';
    }
  }

  private async persistLog(
    deploymentTargetId: string,
    streamType: LogStreamType,
    logContent: string,
  ): Promise<void> {
    const log = this.logsRepo.create({
      deploymentTargetId,
      streamType,
      logContent,
    });
    await this.logsRepo.save(log);
  }
}
