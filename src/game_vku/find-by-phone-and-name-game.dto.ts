import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FindByPhoneAndNameGameDto {
    @ApiProperty({ example: '0987654321', description: 'Phone' })
    @IsString({ message: 'Name game must be a string' })
    phone: string;
    @ApiProperty({ example: 'game1', description: 'Name game' })
    @IsString({ message: 'Name game must be a string' })
    nameGame: string;
}
