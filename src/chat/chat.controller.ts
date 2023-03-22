import { Body, Controller, Get, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../decorators/auth/auth.decorator';

export class TestDto {
    @ApiProperty()
    message: string;
}

@Controller('chat')
@ApiTags('Chat')
@ApiBearerAuth()
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Get()
    @ApiOperation({ summary: 'Get all chats' })
    async findAll() {
        return this.chatService.updateDataBySheet();
    }

    @Post()
    @IsPublic()
    @ApiOperation({ summary: 'Get all chats' })
    async test(@Body() body: TestDto) {
        return this.chatService.test(body.message);
    }
}
