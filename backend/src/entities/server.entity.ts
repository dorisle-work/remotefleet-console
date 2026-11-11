import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServerCredential } from './server-credential.entity';
import { DeploymentTarget } from './deployment-target.entity';

export enum ServerAuthType {
  KEY = 'key',
  PASSWORD = 'password',
}

export enum ServerStatus {
  IDLE = 'idle',
  DEPLOYING = 'deploying',
  OFFLINE = 'offline',
  ERROR = 'error',
}

@Entity('servers')
export class Server {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ name: 'ip_address', length: 45 })
  ipAddress!: string;

  @Column({ name: 'ssh_port', type: 'int', default: 22 })
  sshPort!: number;

  @Column({ name: 'ssh_user', length: 50 })
  sshUser!: string;

  @Column({
    name: 'auth_type',
    type: 'enum',
    enum: ServerAuthType,
    default: ServerAuthType.KEY,
  })
  authType!: ServerAuthType;

  @Column({ name: 'app_directory', length: 255 })
  appDirectory!: string;

  @Column({
    name: 'git_repository',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  gitRepository!: string | null;

  @Column({
    name: 'current_commit',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  currentCommit!: string | null;

  @Column({
    type: 'enum',
    enum: ServerStatus,
    default: ServerStatus.IDLE,
  })
  status!: ServerStatus;

  @Column({ name: 'last_health_check_at', type: 'timestamptz', nullable: true })
  lastHealthCheckAt!: Date | null;

  @Column({ name: 'cpu_percent', type: 'int', nullable: true })
  cpuPercent!: number | null;

  @Column({ name: 'mem_percent', type: 'int', nullable: true })
  memPercent!: number | null;

  @Column({ name: 'disk_percent', type: 'int', nullable: true })
  diskPercent!: number | null;

  @Column({
    name: 'health_message',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  healthMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => ServerCredential, (credential) => credential.server)
  credential!: ServerCredential;

  @OneToMany(() => DeploymentTarget, (target) => target.server)
  deploymentTargets!: DeploymentTarget[];
}
