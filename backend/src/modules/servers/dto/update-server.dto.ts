import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ServerAuthType, ServerStatus } from '../../../entities/server.entity';

export class UpdateServerDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sshPort?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sshUser?: string;

  @IsOptional()
  @IsEnum(ServerAuthType)
  authType?: ServerAuthType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  appDirectory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  gitRepository?: string;

  @IsOptional()
  @IsEnum(ServerStatus)
  status?: ServerStatus;

  @IsOptional()
  @IsString()
  credential?: string;
}
