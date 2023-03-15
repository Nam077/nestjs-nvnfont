import { PartialType } from '@nestjs/swagger';
import { CreateGameVKUDto } from './create-game_vku.dto';

export class UpdateGameVkuDto extends PartialType(CreateGameVKUDto) {}
