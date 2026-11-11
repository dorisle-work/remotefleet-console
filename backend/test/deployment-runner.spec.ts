import { DeploymentRunnerService } from '../src/modules/deployments/deployment-runner.service';
import { LogsGateway } from '../src/modules/streaming/logs.gateway';

describe('DeploymentRunnerService', () => {
  const logsGateway = {
    broadcast: jest.fn(),
  } as unknown as LogsGateway;

  it('builds a remote command that embeds the deploy script', () => {
    const runner = new DeploymentRunnerService(logsGateway);
    const command = runner.buildRemoteCommand(
      '/var/www/app',
      'main',
      'dep-123',
      'production_db',
    );

    expect(command).toContain('base64 -d');
    expect(command).toContain('/tmp/remotefleet-deploy-dep-123.sh');
    expect(command).toContain("'/var/www/app'");
    expect(command).toContain("'main'");
    expect(command).toContain("'production_db'");
  });
});
