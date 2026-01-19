import { ApiProperty } from '@nestjs/swagger';

export class ProductOptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: Number, example: 7 })
  quantity: number;
}
