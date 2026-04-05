import { Injectable } from '@nestjs/common';
import { Store } from './store.entity';
import { BaseStoreResponseDto } from './dto/store.response.dto';

@Injectable()
export class StoreBaseMapper {
  constructor() {}

  toDto(store: Store): BaseStoreResponseDto {
    return {
      description: store.description,
      name: store.name,
      whatsapp: store.whatsapp,
      id: store.id,
      photoUrl: store.photoUrl,
      status: store.status,
      isAvailable: store.isAvailable,
      rating: store.rating,
    };
  }

  toListDto(stores: Store[]): BaseStoreResponseDto[] {
    return stores.map((store) => this.toDto(store));
  }
}
