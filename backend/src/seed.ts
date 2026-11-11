import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ServersService } from './modules/servers/servers.service';
import { ServerAuthType } from './entities/server.entity';

const DEMO_PRIVATE_KEY = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACDemoRemoteFleetSeedKeyDoNotUseInProductionAAAAAAtzc2gtZWQy
NTUxOQAAACDemoRemoteFleetSeedKeyDoNotUseInProductionAAAABADemoSeed
-----END OPENSSH PRIVATE KEY-----`;

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const serversService = app.get(ServersService);

  const existing = await serversService.findAll();
  if (existing.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `Seed skipped: already have ${existing.length} server(s).`,
    );
    await app.close();
    return;
  }

  const demos = [
    {
      name: 'VPS-Client-HCM-01',
      ipAddress: '203.0.113.10',
      sshPort: 22,
      sshUser: 'deployer',
      authType: ServerAuthType.KEY,
      appDirectory: '/var/www/app',
      gitRepository: 'git@github.com:example/client-hcm.git',
      credential: DEMO_PRIVATE_KEY,
    },
    {
      name: 'VPS-Client-HN-02',
      ipAddress: '203.0.113.20',
      sshPort: 22,
      sshUser: 'ubuntu',
      authType: ServerAuthType.KEY,
      appDirectory: '/var/www/production',
      gitRepository: 'git@github.com:example/client-hn.git',
      credential: DEMO_PRIVATE_KEY,
    },
    {
      name: 'VPS-Staging-SG',
      ipAddress: '198.51.100.55',
      sshPort: 2222,
      sshUser: 'deploy',
      authType: ServerAuthType.PASSWORD,
      appDirectory: '/srv/app',
      gitRepository: 'git@github.com:example/staging.git',
      credential: 'demo-staging-password-change-me',
    },
  ];

  for (const demo of demos) {
    const server = await serversService.create(demo);
    // eslint-disable-next-line no-console
    console.log(`Seeded server #${server.id}: ${server.name}`);
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete.');
  await app.close();
}

void seed().catch(async (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
