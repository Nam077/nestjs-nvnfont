import { ForbiddenException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Key } from '../key/entities/key.entity';
import { Font } from '../font/entities/font.entity';
import { AdminFunction, BanCheck, ChatService, DataChat } from '../chat/chat.service';
import { CrawDataGoogle, CrawDataLucky, CrawDataYoutube, CrawlerCovid } from '../chat/crawler/crawler.service';

@Injectable()
export class MessengerService {
    private pageAccessToken: string;
    private apiVersion = 'v15.0';
    private headers;
    private verifyToken = 'verify_token';
    private keys: Key[];
    private isBotCanMessage: boolean;
    private senderPsidAdmin: string[];
    private senderPsidOffBot: string[] = [];

    constructor(private readonly httpService: HttpService, private readonly chatService: ChatService) {
        this.init().catch();
    }

    addSenderPsidOffBot(senderPsid: string) {
        this.senderPsidOffBot.push(senderPsid);
    }

    removeSenderPsidOffBot(senderPsid: string) {
        this.senderPsidOffBot.splice(this.senderPsidOffBot.indexOf(senderPsid), 1);
    }

    getWebHook(mode: string, challenge: string, verifyToken: string) {
        if (mode && verifyToken === this.verifyToken) {
            return challenge;
        }
        throw new ForbiddenException("Can't verify token");
    }

    public async init() {
        this.pageAccessToken = await this.chatService.getPageAccessToken();
        this.headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.pageAccessToken}`,
        };
        this.isBotCanMessage = await this.chatService.getIsBotCanMessage();
        this.senderPsidAdmin = await this.chatService.getAllAdmins();
    }

    public async updateIsBotCanMessage() {
        this.isBotCanMessage = await this.chatService.getIsBotCanMessage();
    }

    public async updateSenderPsidAdmin() {
        this.senderPsidAdmin = await this.chatService.getAllAdmins();
    }

    async sendTextMessage(senderPsid, text) {
        const response = {
            text,
        };
        await this.callSendAPI(senderPsid, response);
    }

    async sendImageMessage(senderPsid, imageUrl) {
        const response = {
            attachment: {
                type: 'image',
                payload: {
                    url: imageUrl,
                },
            },
        };
        await this.callSendAPI(senderPsid, response);
    }

    async callSendAPI(senderPsid, response): Promise<void> {
        const requestBody = {
            recipient: {
                id: senderPsid,
            },
            message: response,
        };
        await this.sendMarkSeen(senderPsid);
        await this.sendTypingOn(senderPsid);
        try {
            await this.httpService
                .post(`https://graph.facebook.com/${this.apiVersion}/me/messages`, requestBody, {
                    headers: this.headers,
                })
                .toPromise()
                .catch();
        } catch (e) {
            console.log("Can't send message!");
        } finally {
            await this.sendTypingOff(senderPsid);
        }
    }

    async sendTypingOn(senderPsid): Promise<void> {
        const requestBody = {
            recipient: {
                id: senderPsid,
            },
            sender_action: 'typing_on',
        };
        return new Promise(async (resolve, reject) => {
            await this.httpService
                .post(`https://graph.facebook.com/${this.apiVersion}/me/messages`, requestBody, {
                    headers: this.headers,
                })
                .toPromise()
                .then(() => resolve())
                .catch(() => reject());
        });
    }

    async sendGreetings(senderPsid: string, userProfile: UserProfile): Promise<void> {
        await this.sendTextMessage(senderPsid, senderPsid);
        await this.sendGreeting(senderPsid, userProfile);
        await this.sendImageMessage(
            senderPsid,
            'https://i.pinimg.com/originals/e0/bf/18/e0bf18ff384586f1b0c1fe7105e859b1.gif',
        );
        await this.sendQuickRepliesGreeting(senderPsid, userProfile);
    }

    async sendQuickRepliesGreeting(senderPsid: string, userProfile: UserProfile) {
        const quick_replies = [
            {
                content_type: 'text',
                title: '👋 Mua tồng hợp font',
                payload: 'BUY_FONT',
            },
            {
                content_type: 'text',
                title: '📚 Hướng dẫn sử dụng',
                payload: 'HOW_TO_USE',
            },
            {
                content_type: 'text',
                title: '📝 Danh sách font',
                payload: 'LIST_FONT',
            },
        ]; //
        const message = `Bạn muốn mình giúp gì nào ${userProfile.name}?`;
        await this.sendQuickReply(senderPsid, message, quick_replies);
    }

    async sendTypingOff(senderPsid): Promise<void> {
        const requestBody = {
            recipient: {
                id: senderPsid,
            },
            sender_action: 'typing_off',
        };
        try {
            return new Promise(async (resolve, reject) => {
                await this.httpService
                    .post(`https://graph.facebook.com/${this.apiVersion}/me/messages`, requestBody, {
                        headers: this.headers,
                    })
                    .toPromise()
                    .then(() => resolve())
                    .catch(() => reject());
            });
        } catch (e) {
            console.log("Can't send typing off!");
        }
    }

    async sendMarkSeen(senderPsid): Promise<void> {
        const requestBody = {
            recipient: {
                id: senderPsid,
            },
            sender_action: 'mark_seen',
        };
        try {
            return new Promise(async (resolve, reject) => {
                await this.httpService
                    .post(`https://graph.facebook.com/${this.apiVersion}/me/messages`, requestBody, {
                        headers: this.headers,
                    })
                    .toPromise()
                    .then(() => resolve())
                    .catch(() => reject());
            });
        } catch (e) {
            console.log("Can't send mark seen!");
        }
    }

    async getUserProfile(senderPsid): Promise<UserProfile> {
        try {
            const response = await this.httpService
                .get(`https://graph.facebook.com/${this.apiVersion}/${senderPsid}`, {
                    params: {
                        fields: 'first_name,last_name,name,profile_pic,id',
                        access_token: this.pageAccessToken,
                    },
                })
                .toPromise();
            return response.data;
        } catch (e) {
            console.log("Can't get user profile!");
        }
    }

    async setGetStartedButton() {
        const requestBody = {
            get_started: {
                payload: 'GET_STARTED',
            },
            greeting: [
                {
                    locale: 'default',
                    text: 'Xin chào bạn đã đến với NVN Font! bạn có thể gửi tin nhắn cho NVN Font để sử dụng bot một cách miễn phí!',
                },
                {
                    locale: 'en_US',
                    text: 'Hi, welcome to NVN Font! You can send message to NVN Font to use bot for free!',
                },
            ],
        };
        try {
            await this.httpService.post(
                `https://graph.facebook.com/${this.apiVersion}/me/messenger_profile`,
                requestBody,
                {
                    headers: this.headers,
                },
            );
        } catch (e) {
            console.log("Can't set get started button!");
        }
    }

    public async setPersistentMenu() {
        //using axios to send message to facebook
        try {
            await this.httpService
                .post(
                    'https://graph.facebook.com/v9.0/me/messenger_profile',
                    {
                        persistent_menu: [
                            {
                                locale: 'default',
                                composer_input_disabled: false,
                                call_to_actions: [
                                    {
                                        type: 'postback',
                                        title: 'Khởi động lại bot',
                                        payload: 'RESTART_BOT',
                                    },
                                    {
                                        type: 'postback',
                                        title: '🔘 Tắt bật bot',
                                        payload: 'TOGGLE_BOT',
                                    },
                                    {
                                        type: 'postback',
                                        title: '👋 Mua tồng hợp font',
                                        payload: 'BOT_BUY',
                                    },
                                    {
                                        type: 'postback',
                                        title: '📚 Xem các font mới nhất',
                                        payload: 'LIST_FONT_IMAGE_END',
                                    },
                                    {
                                        type: 'postback',
                                        title: '📝 Danh sách font',
                                        payload: 'LIST_FONT',
                                    },
                                    {
                                        type: 'postback',
                                        title: 'Xem Demo Danh Sách Font',
                                        payload: 'LIST_FONT_IMAGE',
                                    },
                                    {
                                        type: 'web_url',
                                        title: 'Tham gia group',
                                        url: 'https://www.facebook.com/groups/NVNFONT/',
                                        webview_height_ratio: 'full',
                                    },
                                    {
                                        type: 'postback',
                                        title: 'Xem hướng dẫn sử dụng bot',
                                        payload: 'BOT_TUTORIAL',
                                    },
                                    {
                                        type: 'postback',
                                        title: 'Xem giá Việt hóa',
                                        payload: 'PRICE_SERVICE',
                                    },
                                    {
                                        type: 'web_url',
                                        title: 'Xem Trang',
                                        url: 'https://www.facebook.com/NVNFONT/',
                                        webview_height_ratio: 'full',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: 'Bearer ' + this.pageAccessToken,
                        },
                    },
                )
                .toPromise();
        } catch (error) {
            console.log('Error when set up persistent menu');
        } finally {
            console.log('Set up persistent menu success');
        }
    }

    async postWebHook(body: any) {
        if (body.object == 'page') {
            for (const entry of body.entry) {
                const webhook_event = entry.messaging[0];
                console.log(webhook_event);
                const senderPsid = webhook_event.sender.id;
                console.log('Sender PSID: ' + senderPsid);
                const banCheck: BanCheck = await this.chatService.checkBan(senderPsid);
                if (banCheck.checkBan) {
                    for (const msg of banCheck.message) {
                        await this.sendTextMessage(senderPsid, msg);
                    }
                    return;
                }
                if (this.isBotCanMessage || this.senderPsidAdmin.includes(senderPsid)) {
                    if (webhook_event.message && webhook_event.message.quick_reply) {
                        await this.handleQuickReply(senderPsid, webhook_event.message.quick_reply);
                    }
                    if (webhook_event.message) {
                        if (webhook_event.message.text) {
                            await this.handleMessage(senderPsid, webhook_event.message);
                        }
                        if (webhook_event.message.attachments) {
                            // await this.handleAttachment(sender_psid, webhook_event.message);
                        }
                    } else if (webhook_event.postback) {
                        await this.handlePostback(senderPsid, webhook_event.postback);
                    }
                }
            }
            return 'EVENT_RECEIVED';
        }
    }

    private async handlePostback(senderPsid: string, receivedPostback: any) {
        const userProfile: UserProfile = await this.getUserProfile(senderPsid);
        console.log(userProfile);
        const payload = receivedPostback.payload;
        switch (payload) {
            case 'GET_STARTED':
                await this.sendGreetings(senderPsid, userProfile);
                break;
            case 'RESTART_BOT':
                await this.sendGreetings(senderPsid, userProfile);
                break;
            case 'BOT_BUY':
                await this.sendTextMessage(
                    senderPsid,
                    'Bạn có thể mua tổng hợp của NVN tại đây: https://www.facebook.com/NVNFONT/',
                );
                break;
            case 'LIST_FONT_IMAGE_END':
                await this.sendTextMessage(
                    senderPsid,
                    'Bạn có thể xem các font mới nhất tại đây: https://www.facebook.com/NVNFONT/',
                );
                break;
            case 'LIST_FONT':
                await this.sendListFont(senderPsid, userProfile);
                break;
            case 'LIST_FONT_IMAGE':
                await this.sendTextMessage(
                    senderPsid,
                    'Bạn có thể xem demo danh sách font tại đây: https://www.facebook.com/NVNFONT/',
                );
                break;
            case 'BOT_TUTORIAL':
                await this.sendTextMessage(
                    senderPsid,
                    'Bạn có thể xem hướng dẫn sử dụng bot tại đây: https://www.facebook.com/NVNFONT/',
                );
                break;
            case 'PRICE_SERVICE':
                await this.sendTextMessage(
                    senderPsid,
                    'Bạn có thể xem giá Việt hóa tại đây: https://www.facebook.com/NVNFONT/',
                );
                break;
            case 'TOGGLE_BOT':
                await this.sendQuickReplyToggleBot(senderPsid, userProfile);
                break;
            default:
                await this.sendTextMessage(
                    senderPsid,
                    'Bạn có thể xem trang tại đây: https://www.facebook.com/NVNFONT/',
                );
        }
    }

    private async handleMessage(senderPsid: string, receivedMessage: ReceivedMessage) {
        const userProfile: UserProfile = await this.getUserProfile(senderPsid);
        const message = receivedMessage.text;
        const data: DataChat = await this.chatService.getFontAndResponse(message);
        if (data.fonts.length > 0) {
            if (data.fonts.length == 1) {
                await this.sendSingleFont(senderPsid, data.fonts[0], userProfile);
                return;
            }
            if (data.fonts.length <= 10) {
                await this.sendListFontTemplate(senderPsid, data.fonts, userProfile);
                return;
            }

            if (data.fonts.length > 10) {
                await this.sendListFontText(senderPsid, data.fonts, userProfile);
                return;
            }
        }
        if (data.responses.length > 0) {
            const response = data.responses[Math.floor(Math.random() * data.responses.length)];
            const message = response.messages[Math.floor(Math.random() * response.messages.length)].value;
            await this.sendTextMessage(senderPsid, message);
            return;
        }
        if (message.includes('@lucky')) {
            const lucky: CrawDataLucky = await this.chatService.getLuckNumber(message);
            await this.sendTextMessage(senderPsid, lucky.title);
            return;
        }
        if (message.includes('@nvn')) {
            if (this.senderPsidAdmin.includes(senderPsid)) {
                const adminFunction: AdminFunction = await this.chatService.functionAdmin(senderPsid, message);
                if (adminFunction.typeFunction.includes('REMOVE_ADMIN' || 'ADD_ADMIN')) {
                    await this.updateSenderPsidAdmin();
                    return;
                }
                if (adminFunction.typeFunction.includes('ON_BOT' || 'OFF_BOT')) {
                    await this.updateIsBotCanMessage();
                    return;
                }
                if (adminFunction.typeFunction.includes('ADD_BAN')) {
                    const userProileByPsid: UserProfile = await this.getUserProfile(adminFunction.senderPsid);
                    if (userProileByPsid) {
                        await this.chatService.updateBanName(userProileByPsid.id, userProileByPsid.name);
                        await this.sendTextMessage(
                            senderPsid,
                            'Đã chặn thành công người dùng: ' + userProileByPsid.name + '!',
                        );
                        await this.sendTextMessage(adminFunction.senderPsid, 'Bạn đã bị chặn khỏi bot!');
                        return;
                    } else {
                        await this.chatService.removeBanByPsid(adminFunction.senderPsid);
                        await this.sendTextMessage(senderPsid, 'Không tìm thấy người dùng!');
                        return;
                    }
                }
                if (adminFunction.typeFunction.includes('REMOVE_BAN')) {
                    if (adminFunction.senderPsid) {
                        await this.chatService.removeBanByPsid(adminFunction.senderPsid);
                        await this.sendTextMessage(senderPsid, 'Đã bỏ chặn thành công!');
                        await this.sendTextMessage(adminFunction.senderPsid, 'Bạn đã được bỏ chặn!');
                        await this.sendTextMessage(adminFunction.senderPsid, adminFunction.senderPsid);
                        return;
                    } else {
                        await this.sendTextMessage(senderPsid, adminFunction.message);
                    }
                }

                if (adminFunction.typeFunction.includes('LIST_BAN')) {
                    for (const msg of adminFunction.message) {
                        await this.sendTextMessage(senderPsid, msg);
                    }
                    return;
                } else await this.sendTextMessage(senderPsid, adminFunction.message);
                return;
            }
            await this.sendTextMessage(senderPsid, 'Bạn không có quyền sử dụng lệnh này!');
            return;
        }
        if (message.includes('@xsmb')) {
            const xsmb: string = await this.chatService.getDataXoSo();
            await this.sendTextMessage(senderPsid, xsmb);
            return;
        }
        if (message.includes('@ytb')) {
            const ytb: CrawDataYoutube[] = await this.chatService.getDataCrawlerYoutube(message);
            await this.sendMultiYoutubeMessage(senderPsid, ytb);
            return;
        }
        if (message.includes('@covid')) {
            const covid: CrawlerCovid = await this.chatService.getDataCrawlerCovid(message);
            if (covid.type === 'singleLocation') {
                await this.sendTextMessage(senderPsid, covid.data);
                return;
            }
            if (covid.type === 'allLocation') {
                await this.sendTextMessage(senderPsid, covid.data);
                await this.sendTextMessage(senderPsid, 'Đây là dữ liệu tổng hợp các ca bệnh trên toàn thế giới');
                await this.sendTextMessage(
                    senderPsid,
                    `Nếu bạn muốn xem dữ liệu chi tiết hãy nhập @covid tại <Quốc gia> `,
                );
                await this.sendTextMessage(senderPsid, 'Ví dụ: @covid tại Việt Nam');
                return;
            }
            return;
        } else {
            const crawlerGoogles: CrawDataGoogle[] = await this.chatService.getDataCrawlerGoogle(message);
            if (crawlerGoogles.length > 0) {
                const crawlerGoogle = crawlerGoogles[0];
                if (typeof crawlerGoogle.data === 'string') {
                    await this.sendTextMessage(senderPsid, crawlerGoogle.data);
                    return;
                }
                if (crawlerGoogle.data instanceof Array) {
                    for (const data of crawlerGoogle.data) {
                        await this.sendTextMessage(senderPsid, data);
                    }
                    return;
                }
            } else {
                return;
            }
        }
        return;
    }

    private async sendMultiYoutubeMessage(senderPsid: string, ytb: CrawDataYoutube[]) {
        const elements: any[] = [];
        for (const item of ytb) {
            elements.push({
                title: item.title,
                image_url: item.thumbnail || 'https://picsum.photos/600/40' + Math.floor(Math.random() * 10),
                subtitle: item.duration,
                default_action: {
                    type: 'web_url',
                    url: item.url || 'fb.com/nvnfont',
                    webview_height_ratio: 'tall',
                },
                buttons: [
                    {
                        type: 'web_url',
                        title: 'Xem Video',
                        url: item.url || 'fb.com/nvnfont',
                    },
                ],
            });
        }
        await this.sendGenericMessage(senderPsid, elements);
    }

    public async sendGenericMessage(senderPsid: string, elements: any) {
        // Create the payload for a basic text message
        try {
            const response = {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'generic',
                        elements: elements,
                    },
                },
            };
            await this.callSendAPI(senderPsid, response);
        } catch (error) {
            return;
        }
    }

    private async handleQuickReply(senderPsid: string, receivedQuickReply: ReceivedQuickReply) {
        const payload = receivedQuickReply.payload;
        switch (payload) {
            case 'ON_BOT':
                await this.sendTextMessage(senderPsid, 'Bạn đã bật bot!');
                await this.removeSenderPsidOffBot(senderPsid);
                break;
            case 'OFF_BOT':
                await this.sendTextMessage(senderPsid, 'Bạn đã tắt bot!');
                await this.addSenderPsidOffBot(senderPsid);
                break;
            default:
                break;
        }
        return;
    }

    async test(senderPsid: string) {
        await this.sendTextMessage(senderPsid, 'Đang xử lý...');
    }

    async getInfo(id: string) {
        return await this.getUserProfile(id);
    }

    async setUp() {
        await this.setGetStartedButton();
        await this.setPersistentMenu();
    }

    private async handleAttachment(senderPsid: any, receivedAttachment: ReceivedAttachment) {
        const url = receivedAttachment.attachments[0].payload.url;
        const user = await this.getUserProfile(senderPsid);
        await this.sendTextMessage(senderPsid, `Chào bạn ${user.name}! bạn đã gửi ảnh: ${url}`);
        await this.sendImageMessage(senderPsid, url);
    }

    private async sendAttachmentMessage(recipientId: string, attachment: Attachment) {
        const response = {
            attachment,
        };
        await this.callSendAPI(recipientId, response);
    }

    public getResponseFont(font: Font, userProfile: UserProfile): any {
        const message = `Chào ${userProfile.name}\nTôi đã nhận được yêu cầu từ bạn\nTên font: ${
            font.name
        }\nLink download: ${font.links[Math.floor(Math.random() * font.links.length)].url}`;

        return {
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'button',
                    text: message,
                    buttons: [
                        {
                            type: 'web_url',
                            url: font.links[Math.floor(Math.random() * font.links.length)].url,
                            title: 'Tải xuống',
                        },
                        {
                            type: 'postback',
                            title: 'Font khác',
                            payload: 'LIST_FONT',
                        },
                    ],
                },
            },
        };
    }

    private async sendSingleFont(senderPsid: string, font: Font, userProfile: UserProfile) {
        await this.sendImageMessage(senderPsid, font.images[Math.floor(Math.random() * font.images.length)].url);
        const response = this.getResponseFont(font, userProfile);
        await this.callSendAPI(senderPsid, response);
    }

    public async sendGreeting(senderPsid: string, userProfile: UserProfile) {
        const date = new Date();
        date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        const hour = date.getHours();
        if (hour >= 5 && hour < 10) {
            await this.sendTextMessage(senderPsid, `Chào ${userProfile.name}, chúc bạn một buổi sáng tốt lành!`);
        } else if (hour >= 10 && hour <= 12) {
            await this.sendTextMessage(senderPsid, `Chào ${userProfile.name}, bạn đã ăn trưa chưa?`);
        } else if (hour > 12 && hour < 18) {
            await this.sendTextMessage(senderPsid, `Chào ${userProfile.name}, chúc bạn một buổi chiều tốt lành!`);
        } else if (hour >= 18 && hour < 22) {
            await this.sendTextMessage(
                senderPsid,
                `Chào ${userProfile.name}, chúc bạn một buổi tối tốt lành, bạn đã ăn tối chưa?`,
            );
        } else if (hour >= 22 && hour < 24) {
            await this.sendTextMessage(
                senderPsid,
                `Chào ${userProfile.name}, khuya rồi làm việc ít thôi nè, đi ngủ đi!`,
            );
        } else if (hour >= 0 && hour < 5) {
            await this.sendTextMessage(
                senderPsid,
                `Chào ${userProfile.name}, Nếu bạn nhắn tin giờ này thì đang làm phiền mình đây không nên nhé!`,
            );
        }
    }

    private async sendListFontTemplate(senderPsid: string, fonts: Font[], userProfile: UserProfile) {
        const elements: any[] = [];
        for (const font of fonts) {
            elements.push({
                title: font.name,
                image_url: font.images[Math.floor(Math.random() * font.images.length)].url,
                subtitle: font.description,
                default_action: {
                    type: 'web_url',
                    url: font.urlPost,
                    webview_height_ratio: 'tall',
                },
                buttons: this.getButtonLinkFont(font),
            });
        }
        await this.sendGenericMessage(senderPsid, elements);
    }

    private getButtonLinkFont(font: Font) {
        const buttons: any[] = [];
        for (let i = 0; i < font.links.length && i < 3; i++) {
            buttons.push({
                type: 'web_url',
                url: font.links[i].url,
                title: 'Link ' + (i + 1),
            });
        }
        return buttons;
    }

    private async sendListFontText(senderPsid: string, fonts: Font[], userProfile: UserProfile) {
        const dataFont: string[] = this.getTextFromFonts(fonts);
        const message = `Chào ${userProfile.name}\nTôi đã nhận được yêu cầu từ bạn\nBạn có thể tải font theo link bên dưới\n`;
        await this.sendTextMessage(senderPsid, message);
        const chunkFont = this.chunkArray(dataFont, 10);
        for (const chunk of chunkFont) {
            await this.sendTextMessage(senderPsid, chunk.join('\n\n'));
        }
        return;
    }

    private getTextFromFonts(fonts: Font[]) {
        const dataFont: string[] = [];
        for (const font of fonts) {
            dataFont.push(
                `Tên font: ${font.name}\nLink download: ${
                    font.links[Math.floor(Math.random() * font.links.length)].url
                }`,
            );
        }
        return dataFont;
    }

    private chunkArray(myArray: any[], chunk_size: number): any[][] {
        const results = [];
        for (let i = 0; i < myArray.length; i += chunk_size) {
            results.push(myArray.slice(i, i + chunk_size));
        }
        return results;
    }

    public async sendListFont(senderPsid: string, userProfile: UserProfile) {
        const listFonts = this.chatService.getListFont();
        for (const listFont of listFonts) {
            await this.sendTextMessage(senderPsid, listFont.value);
        }
        const message =
            `Chào ${userProfile.name}\nĐây là danh sách font đang có trên hệ thống\n` +
            `Bạn có thể tải xuống bẳng cách nhắn tin theo cú pháp: Tôi muốn tải font <tên font>\n` +
            `Ví dụ: Tôi muốn tải font NVN Parka\n`;
        await this.sendTextMessage(senderPsid, message);
        return;
    }

    private async sendQuickReplyToggleBot(senderPsid: string, userProfile: UserProfile) {
        if (this.senderPsidOffBot.includes(senderPsid)) {
            const message = `Chào ${userProfile.name}\nBạn đã tắt bot, bạn có muốn bật lại bot không?`;
            const quickReplies = [
                {
                    content_type: 'text',
                    title: '🟢 Bật bot',
                    payload: 'ON_BOT',
                },
            ];
            await this.sendQuickReply(senderPsid, message, quickReplies);
        } else {
            const message = `Chào ${userProfile.name}\nBạn đã bật bot, bạn có muốn tắt bot không?`;
            const quickReplies = [
                {
                    content_type: 'text',
                    title: '🔴 Tắt bot',
                    payload: 'OFF_BOT',
                },
            ];
            await this.sendQuickReply(senderPsid, message, quickReplies);
        }
    }

    private async sendQuickReply(senderPsid: string, message: string, quickReplies: any) {
        const response = {
            text: message,
            quick_replies: quickReplies,
        };
        await this.callSendAPI(senderPsid, response);
    }
}

export interface UserProfile {
    first_name: string;
    last_name: string;
    profile_pic: string;
    name: string;
    id: string;
}

export interface ReceivedMessage {
    mid: string;
    text: string;
}

export interface ReceivedAttachment {
    type: string;
    attachments: Attachment[];
}

export interface Attachment {
    type: string;
    payload: {
        url: string;
    };
}

export interface ReceivedPostback {
    title: string;
    payload: string;
    mid: string;
}

export type ReceivedQuickReply = ReceivedPostback;
