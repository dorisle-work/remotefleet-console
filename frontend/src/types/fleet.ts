export type ServerStatus = 'idle' | 'deploying' | 'offline' | 'error';

export interface FleetServer {
  id: string;
  name: string;
  ipAddress: string;
  sshPort: number;
  sshUser: string;
  authType: 'key' | 'password';
  appDirectory: string;
  gitRepository: string | null;
  currentCommit: string | null;
  status: ServerStatus;
  lastHealthCheckAt: string | null;
  cpuPercent: number | null;
  memPercent: number | null;
  diskPercent: number | null;
  healthMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DeploymentStatus =
  | 'queued'
  | 'running'
  | 'success'
  | 'failed'
  | 'rolled_back';

export type DeploymentTargetStatus =
  | 'pending'
  | 'in_progress'
  | 'success'
  | 'failed'
  | 'rolled_back';

export interface DeploymentLog {
  id: string;
  deploymentTargetId: string;
  streamType: 'stdout' | 'stderr' | 'system';
  logContent: string;
  createdAt: string;
}

export interface DeploymentTarget {
  id: string;
  deploymentId: string;
  serverId: string;
  status: DeploymentTargetStatus;
  previousCommit: string | null;
  deployedCommit: string | null;
  exitCode: number | null;
  errorMessage: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  server?: FleetServer;
  logs?: DeploymentLog[];
}

export interface Deployment {
  id: string;
  initiatedBy: string;
  targetBranch: string;
  targetCommitHash: string | null;
  status: DeploymentStatus;
  totalServers: number;
  successfulServers: number;
  failedServers: number;
  createdAt: string;
  finishedAt: string | null;
  targets: DeploymentTarget[];
}

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

export interface ServerFormValues {
  name: string;
  ipAddress: string;
  sshPort: number;
  sshUser: string;
  appDirectory: string;
  gitRepository?: string;
  authType: 'key' | 'password';
  credential?: string;
}
