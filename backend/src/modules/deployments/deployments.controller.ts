import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { DeploymentsService } from './deployments.service';
import { TriggerDeploymentDto } from './dto/trigger-deployment.dto';

interface AuthenticatedRequest extends Request {
  operator?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@Controller('api/v1/deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Get()
  findAll() {
    return this.deploymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deploymentsService.findOne(id);
  }

  @Get(':id/targets/:targetId/logs')
  findTargetLogs(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
  ) {
    return this.deploymentsService.findTargetLogs(id, targetId);
  }

  @Post()
  trigger(@Body() dto: TriggerDeploymentDto, @Req() req: AuthenticatedRequest) {
    if (!dto.initiatedBy && req.operator?.email) {
      dto.initiatedBy = req.operator.email;
    }
    return this.deploymentsService.trigger(dto);
  }
}
