import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateGameVKUDto {
    @ApiProperty({ description: 'Name of player' })
    @IsString({ message: 'Name of player must be a string' })
    namePlayer: string;

    @ApiProperty({ description: 'Name of game' })
    @IsString({ message: 'Name of game must be a string' })
    nameGame: string;

    @ApiProperty({ description: 'Score' })
    @IsNumber({}, { message: 'Score must be a number' })
    score: number;

    @ApiProperty({ description: 'School' })
    @IsString({ message: 'School must be a string' })
    school: string;

    @ApiProperty({ description: 'Phone' })
    @IsString({ message: 'Phone must be a string' })
    phone: string;
}
