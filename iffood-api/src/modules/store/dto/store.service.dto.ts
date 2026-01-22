import { BaseStoreDto, CreateStoreDto } from './store.core.dto';

export interface ServiceCreateStoreDto extends CreateStoreDto {
  photoBuffer: Buffer;
  userId: string;
}

export interface ServiceUpdateStoreDto extends Partial<BaseStoreDto> {
  status?: boolean;
  userId: string;
  storeId: string;
}
