import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DeploymentTarget } from './deployment-target.entity';

export enum LogStreamType {
  STDOUT = 'stdout',
  STDERR = 'stderr',
  SYSTEM = 'system',
}

@Entity('deployment_logs')
export class DeploymentLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'deployment_target_id', type: 'bigint' })
  deploymentTargetId!: string;

  @Column({
    name: 'stream_type',
    type: 'enum',
    enum: LogStreamType,
    default: LogStreamType.STDOUT,
  })
  streamType!: LogStreamType;

  @Column({ name: 'log_content', type: 'text' })
  logContent!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => DeploymentTarget, (target) => target.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deployment_target_id' })
  deploymentTarget!: DeploymentTarget;
}
