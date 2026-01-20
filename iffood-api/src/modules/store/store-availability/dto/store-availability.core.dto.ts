export class StoreAvailabilityCoreDtoUnit {
  weekday: number;
  start: string;
  end: string;
}

export class UpdateStoreAvailabilityCoreDto {
  availabilities: StoreAvailabilityCoreDtoUnit[];
  storeId: string;
}
