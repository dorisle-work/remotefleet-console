import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class TriggerDeploymentDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  serverIds!: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  targetBranch!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  targetCommitHash?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  initiatedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dbName?: string;
}
