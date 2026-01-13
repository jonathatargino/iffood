import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  whatsapp: string;
}

export class UpdateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  whatsapp: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export interface FindAllStoreFilters {
  name?: string;
  pageSize: number;
  page: number;
}
