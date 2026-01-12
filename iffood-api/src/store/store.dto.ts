import { IsNotEmpty, IsString } from 'class-validator';

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

export interface FindAllStoreFilters {
  name?: string;
  pageSize: number;
  page: number;
}
