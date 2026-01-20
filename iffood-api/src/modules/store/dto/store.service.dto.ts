import { CreateStoreDto } from './store.core.dto';

export interface ServiceCreateStoreDto extends CreateStoreDto {
  photoBuffer: Buffer;
  userId: string;
}
