import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { GameVkuService } from './game_vku.service';
import { CreateGameVKUDto } from './dto/create-game_vku.dto';
import { UpdateGameVkuDto } from './dto/update-game_vku.dto';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../decorators/auth/auth.decorator';
import { FindByPhoneAndNameGameDto } from './find-by-phone-and-name-game.dto';

@ApiTags('Game VKU')
@Controller('game-vku')
export class GameVkuController {
    constructor(private readonly gameVkuService: GameVkuService) {}

    @IsPublic()
    @Post()
    create(@Body() createGameVkuDto: CreateGameVKUDto) {
        return this.gameVkuService.create(createGameVkuDto);
    }

    @IsPublic()
    @Post('/find-by-phone-and-name_game')
    findByPhoneAndNameGame(@Body() findByPhoneAndNamGame: FindByPhoneAndNameGameDto) {
        return this.gameVkuService.findByPhoneAndNameGame(findByPhoneAndNamGame.phone, findByPhoneAndNamGame.nameGame);
    }

    @IsPublic()
    @Get()
    findAll() {
        return this.gameVkuService.findAll();
    }

    @IsPublic()
    @Get('/find-all-game')
    findAllGame() {
        return this.gameVkuService.findAllGame();
    }

    @IsPublic()
    @Get('/ranking/:nameGame')
    ranking(@Param('nameGame') nameGame: string) {
        return this.gameVkuService.ranking(nameGame);
    }

    @IsPublic()
    @Get('/admin-ranking/:nameGame')
    adminRanking(@Param('nameGame') nameGame: string) {
        return this.gameVkuService.adminRanking(nameGame);
    }

    @IsPublic()
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.gameVkuService.findOne(+id);
    }

    @IsPublic()
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateGameVkuDto: UpdateGameVkuDto) {
        return this.gameVkuService.update(+id, updateGameVkuDto);
    }

    @IsPublic()
    @Delete('/delete-by/:nameGame')
    deleteBy(@Param('nameGame') nameGame: string, @Query('confirm') confirm: string) {
        return this.gameVkuService.deleteBy(nameGame, confirm);
    }

    @IsPublic()
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.gameVkuService.remove(+id);
    }
}
