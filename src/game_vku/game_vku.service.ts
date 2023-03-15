import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateGameVKUDto } from './dto/create-game_vku.dto';
import { UpdateGameVkuDto } from './dto/update-game_vku.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { GameVKU } from './entities/game_vku.entity';
import { Not, Repository } from 'typeorm';

@Injectable()
export class GameVkuService {
    constructor(@InjectRepository(GameVKU) private gameVkuRepository: Repository<GameVKU>) {}

    async create(createGameVkuDto: CreateGameVKUDto): Promise<GameVKU> {
        return this.createOrUpdate(createGameVkuDto);
    }

    async findByPhone(phone: string): Promise<GameVKU> {
        return this.gameVkuRepository.findOne({
            where: {
                phone,
            },
        });
    }

    async findByNamesGame(nameGame: string): Promise<GameVKU> {
        return this.gameVkuRepository.findOne({
            where: {
                nameGame,
            },
        });
    }

    async findByPhoneAndNameGame(phone: string, nameGame: string): Promise<GameVKU> {
        return this.gameVkuRepository.findOne({
            where: {
                phone,
                nameGame,
            },
        });
    }

    async createOrUpdate(createGameVKUDto: CreateGameVKUDto): Promise<GameVKU> {
        const { phone, nameGame } = createGameVKUDto;
        const gameVku = await this.findByPhoneAndNameGame(phone, nameGame);
        if (gameVku) {
            if (createGameVKUDto.score > gameVku.score) {
                gameVku.score = createGameVKUDto.score;
                return this.gameVkuRepository.save(gameVku);
            }
        } else {
            return this.gameVkuRepository.save(createGameVKUDto);
        }
    }

    hidePhone(phone: string): string {
        return phone.replace(/^(\d{3})\d+(\d{3})$/, '$1****$2');
    }

    async findAll(): Promise<GameVKU[]> {
        const result = await this.gameVkuRepository.find();
        result.map((item) => {
            item.phone = this.hidePhone(item.phone);
        });
        return result;
    }

    async findOne(id: number): Promise<GameVKU> {
        return this.gameVkuRepository.findOne({
            where: {
                id,
            },
        });
    }

    async update(id: number, updateGameVkuDto: UpdateGameVkuDto): Promise<GameVKU> {
        const gameVKU = await this.gameVkuRepository.findOne({
            where: {
                id: Not(id),
            },
        });
        if (gameVKU && gameVKU.phone === updateGameVkuDto.phone) {
            throw new HttpException('Phone already exists', HttpStatus.BAD_REQUEST);
        }
        const gameVku = await this.gameVkuRepository.findOne({
            where: {
                id,
            },
        });
        if (!gameVku) {
            throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
        }

        await this.gameVkuRepository.update(id, updateGameVkuDto);
        return this.findOne(id);
    }

    async remove(id: number): Promise<string> {
        const gameVku = await this.gameVkuRepository.findOne({
            where: {
                id,
            },
        });
        if (!gameVku) {
            throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
        }
        await this.gameVkuRepository.delete(id);
        return 'Game deleted';
    }

    async ranking(nameGame: string): Promise<GameVKU[]> {
        const result = await this.gameVkuRepository.find({
            where: {
                nameGame,
            },
            order: {
                score: 'DESC',
            },
        });
        result.map((item) => {
            item.phone = this.hidePhone(item.phone);
        });
        return result;
    }

    async findAllGame(): Promise<string[]> {
        const result = await this.gameVkuRepository.find();
        return result.reduce((acc: string[], item) => {
            if (!acc.includes(item.nameGame)) {
                acc.push(item.nameGame);
            }
            return acc;
        }, []);
    }

    async adminRanking(nameGame: string): Promise<GameVKU[]> {
        if (nameGame === 'all') {
            return this.gameVkuRepository.find({
                order: {
                    nameGame: 'DESC',
                    score: 'DESC',
                },
            });
        }
        return this.gameVkuRepository.find({
            where: {
                nameGame,
            },
        });
    }

    async deleteBy(nameGame: string, confirm: string): Promise<string> {
        if (!confirm && confirm !== 'yes') {
            throw new HttpException('Confirm is not correct', HttpStatus.BAD_REQUEST);
        }
        if (nameGame === 'all') {
            await this.gameVkuRepository.delete({});
            return 'All games deleted';
        }
        await this.gameVkuRepository.delete({
            nameGame,
        });
        return 'Game deleted';
    }
}
