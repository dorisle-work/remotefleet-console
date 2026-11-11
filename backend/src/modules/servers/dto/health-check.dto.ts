import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

export class BulkHealthCheckDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  serverIds?: string[];
}
