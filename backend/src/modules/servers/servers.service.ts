import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, ServerAuthType } from '../../entities/server.entity';
import { ServerCredential } from '../../entities/server-credential.entity';
import { VaultService } from '../vault/vault.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Server)
    private readonly serversRepo: Repository<Server>,
    @InjectRepository(ServerCredential)
    private readonly credentialsRepo: Repository<ServerCredential>,
    private readonly vaultService: VaultService,
  ) {}

  async findAll(): Promise<Server[]> {
    return this.serversRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Server> {
    const server = await this.serversRepo.findOne({ where: { id } });
    if (!server) {
      throw new NotFoundException(`Server #${id} không tồn tại`);
    }
    return server;
  }

  async findWithCredential(id: string): Promise<{
    server: Server;
    plaintextCredential: string;
  }> {
    const server = await this.serversRepo.findOne({
      where: { id },
      relations: ['credential'],
    });
    if (!server || !server.credential) {
      throw new NotFoundException(`Server #${id} hoặc credential không tồn tại`);
    }

    const plaintextCredential = this.vaultService.decryptCredential(
      server.credential.encryptedPayload,
      server.credential.iv,
      server.credential.authTag,
    );

    return { server, plaintextCredential };
  }

  async create(dto: CreateServerDto): Promise<Server> {
    const encrypted = this.vaultService.encryptCredential(dto.credential);

    const server = this.serversRepo.create({
      name: dto.name,
      ipAddress: dto.ipAddress,
      sshPort: dto.sshPort ?? 22,
      sshUser: dto.sshUser,
      authType: dto.authType ?? ServerAuthType.KEY,
      appDirectory: dto.appDirectory,
      gitRepository: dto.gitRepository ?? null,
    });

    const saved = await this.serversRepo.save(server);

    const credential = this.credentialsRepo.create({
      serverId: saved.id,
      encryptedPayload: encrypted.encryptedPayload,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    });
    await this.credentialsRepo.save(credential);

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateServerDto): Promise<Server> {
    const server = await this.findOne(id);

    if (dto.name !== undefined) server.name = dto.name;
    if (dto.ipAddress !== undefined) server.ipAddress = dto.ipAddress;
    if (dto.sshPort !== undefined) server.sshPort = dto.sshPort;
    if (dto.sshUser !== undefined) server.sshUser = dto.sshUser;
    if (dto.authType !== undefined) server.authType = dto.authType;
    if (dto.appDirectory !== undefined) server.appDirectory = dto.appDirectory;
    if (dto.gitRepository !== undefined) server.gitRepository = dto.gitRepository;
    if (dto.status !== undefined) server.status = dto.status;

    await this.serversRepo.save(server);

    if (dto.credential) {
      const encrypted = this.vaultService.encryptCredential(dto.credential);
      let credential = await this.credentialsRepo.findOne({
        where: { serverId: id },
      });

      if (!credential) {
        credential = this.credentialsRepo.create({ serverId: id });
      }

      credential.encryptedPayload = encrypted.encryptedPayload;
      credential.iv = encrypted.iv;
      credential.authTag = encrypted.authTag;
      await this.credentialsRepo.save(credential);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const server = await this.findOne(id);
    await this.serversRepo.remove(server);
  }
}
