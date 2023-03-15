import { Module } from '@nestjs/common';
import { GameVkuService } from './game_vku.service';
import { GameVkuController } from './game_vku.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameVKU } from './entities/game_vku.entity';

@Module({
    imports: [TypeOrmModule.forFeature([GameVKU])],
    controllers: [GameVkuController],
    providers: [GameVkuService],
    exports: [GameVkuService],
})
export class GameVkuModule {}
