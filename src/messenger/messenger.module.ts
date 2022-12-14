import { Module } from '@nestjs/common';
import { MessengerService } from './messenger.service';
import { MessengerController } from './messenger.controller';
import { HttpModule } from '@nestjs/axios';
import { ChatModule } from '../chat/chat.module';

@Module({
    imports: [HttpModule, ChatModule],
    controllers: [MessengerController],
    providers: [MessengerService],
})
export class MessengerModule {}
