import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileCoreResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  photoUrl?: string;

  @ApiPropertyOptional()
  whatsapp?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
