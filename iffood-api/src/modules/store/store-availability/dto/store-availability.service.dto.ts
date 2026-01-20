import { UpdateStoreAvailabilityCoreDto } from './store-availability.core.dto';

export interface ServiceUpdateStoreAvailabilityDto extends UpdateStoreAvailabilityCoreDto {
  userId: string;
}
