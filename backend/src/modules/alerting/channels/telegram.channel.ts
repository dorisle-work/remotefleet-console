import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramChannel {
  private readonly logger = new Logger(TelegramChannel.name);

  constructor(private readonly configService: ConfigService) {}

  async send(message: string): Promise<void> {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');

    if (!token || !chatId || token.includes('ABCdef')) {
      this.logger.warn(`Telegram chưa cấu hình. Bỏ qua: ${message}`);
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`Telegram API error: ${response.status} ${body}`);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Không gửi được Telegram: ${err.message}`);
    }
  }
}
