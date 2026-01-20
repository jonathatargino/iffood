export interface BaseStoreDto {
  name: string;
  description: string;
  whatsapp: string;
}

export interface CreateStoreDto extends BaseStoreDto {}

export interface UpdateStoreDto extends Partial<BaseStoreDto> {
  status?: boolean;
}

export interface FindAllStoreFilters {
  pageSize: number;
  page: number;
  name?: string;
  weekday?: number;
  hours?: string;
}
