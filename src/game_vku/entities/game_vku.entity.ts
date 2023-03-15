import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'game_vku', synchronize: true, orderBy: { id: 'ASC' } })
export class GameVKU {
    @PrimaryGeneratedColumn({ comment: 'Id of the game_vku' })
    id: number;

    // namePlayer, nameGame, score, school,  phone,
    @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Name player', name: 'name_player' })
    namePlayer: string;

    @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Name Game', name: 'name_game' })
    nameGame: string;

    @Column({ type: 'float', nullable: false, comment: 'Score' })
    score: number;

    @Column({ type: 'varchar', length: 255, nullable: false, comment: 'School' })
    school: string;

    @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Phone' })
    phone: string;

    @CreateDateColumn({ type: 'timestamp', comment: 'GameVKU created at' })
    createdAt: Date;

    @CreateDateColumn({ type: 'timestamp', comment: 'GameVKU updated at' })
    updatedAt: Date;
}
