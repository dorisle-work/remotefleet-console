import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from '../../entities/server.entity';
import { Deployment } from '../../entities/deployment.entity';
import { SystemController } from './system.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Server, Deployment])],
  controllers: [SystemController],
})
export class SystemModule {}
