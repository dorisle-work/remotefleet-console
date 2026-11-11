import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ServersService } from './servers.service';
import { ServerHealthService } from './server-health.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { BulkHealthCheckDto } from './dto/health-check.dto';

@Controller('api/v1/servers')
export class ServersController {
  constructor(
    private readonly serversService: ServersService,
    private readonly healthService: ServerHealthService,
  ) {}

  @Get()
  findAll() {
    return this.serversService.findAll();
  }

  @Post('health-check')
  checkMany(@Body() dto: BulkHealthCheckDto) {
    return this.healthService.checkMany(dto.serverIds);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serversService.findOne(id);
  }

  @Post(':id/health-check')
  checkOne(@Param('id') id: string) {
    return this.healthService.checkOne(id);
  }

  @Post()
  create(@Body() dto: CreateServerDto) {
    return this.serversService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServerDto) {
    return this.serversService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.serversService.remove(id);
    return { deleted: true, id };
  }
}
