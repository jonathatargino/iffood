import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateWhatsappRequestDto {
  @ApiProperty({ description: 'Whatsapp number (format: DDD + 9XXXXXXXX)' })
  @IsString()
  @IsNotEmpty()
  whatsapp: string;
}
