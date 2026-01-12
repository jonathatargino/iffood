import { IsArray, IsInt, IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpdateStoreAvailabilityDtoUnit {
  @IsInt()
  @IsNotEmpty()
  weekday: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  start: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  end: string;
}

export class UpdateStoreAvailabilityDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  availabilities: UpdateStoreAvailabilityDtoUnit[];

  @IsNotEmpty()
  @IsString()
  storeId: string;
}

export interface UpdateStoreAvailabilityWithUserIdDto extends UpdateStoreAvailabilityDto {
  userId: string;
}
