import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ServerAuthType } from '../../../entities/server.entity';

export class CreateServerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(45)
  ipAddress!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sshPort?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sshUser!: string;

  @IsOptional()
  @IsEnum(ServerAuthType)
  authType?: ServerAuthType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  appDirectory!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  gitRepository?: string;

  @IsString()
  @IsNotEmpty()
  credential!: string;
}
