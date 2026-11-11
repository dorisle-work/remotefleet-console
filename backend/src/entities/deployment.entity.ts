import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { DeploymentTarget } from './deployment-target.entity';

export enum DeploymentStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

@Entity('deployments')
export class Deployment {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'initiated_by', length: 100 })
  initiatedBy!: string;

  @Column({ name: 'target_branch', length: 100 })
  targetBranch!: string;

  @Column({
    name: 'target_commit_hash',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  targetCommitHash!: string | null;

  @Column({
    type: 'enum',
    enum: DeploymentStatus,
    default: DeploymentStatus.QUEUED,
  })
  status!: DeploymentStatus;

  @Column({ name: 'total_servers', type: 'int', default: 0 })
  totalServers!: number;

  @Column({ name: 'successful_servers', type: 'int', default: 0 })
  successfulServers!: number;

  @Column({ name: 'failed_servers', type: 'int', default: 0 })
  failedServers!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;

  @OneToMany(() => DeploymentTarget, (target) => target.deployment)
  targets!: DeploymentTarget[];
}
