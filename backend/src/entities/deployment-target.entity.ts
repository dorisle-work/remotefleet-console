import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Deployment } from './deployment.entity';
import { Server } from './server.entity';
import { DeploymentLog } from './deployment-log.entity';

export enum DeploymentTargetStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

@Entity('deployment_targets')
export class DeploymentTarget {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'deployment_id', type: 'uuid' })
  deploymentId!: string;

  @Column({ name: 'server_id', type: 'bigint' })
  serverId!: string;

  @Column({
    type: 'enum',
    enum: DeploymentTargetStatus,
    default: DeploymentTargetStatus.PENDING,
  })
  status!: DeploymentTargetStatus;

  @Column({
    name: 'previous_commit',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  previousCommit!: string | null;

  @Column({
    name: 'deployed_commit',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  deployedCommit!: string | null;

  @Column({ name: 'exit_code', type: 'int', nullable: true })
  exitCode!: number | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;

  @ManyToOne(() => Deployment, (deployment) => deployment.targets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deployment_id' })
  deployment!: Deployment;

  @ManyToOne(() => Server, (server) => server.deploymentTargets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'server_id' })
  server!: Server;

  @OneToMany(() => DeploymentLog, (log) => log.deploymentTarget)
  logs!: DeploymentLog[];
}
