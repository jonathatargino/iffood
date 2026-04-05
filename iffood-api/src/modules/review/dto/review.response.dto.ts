import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  rating: number;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ format: 'uuid' })
  reviewRequestId: string;

  @ApiProperty()
  createdAt: Date;
}

export class ReviewRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ format: 'uuid' })
  orderRequestId: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  storeId: string | null;

  @ApiProperty({ nullable: true })
  storeName: string | null;

  @ApiProperty({ nullable: true })
  storePhotoUrl: string | null;

  @ApiProperty()
  createdAt: Date;
}
