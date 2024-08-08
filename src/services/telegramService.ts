import TelegramBot from 'node-telegram-bot-api';
import {IArticle} from "../models/Article";
import dotenv from 'dotenv';

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {polling: true});
const channelId = process.env.TELEGRAM_CHANNEL!;

export async function sendMessage(article: Pick<IArticle, 'translatedContent' | 'url' | 'significance' | 'translatedTitle' | 'source' | 'tags'>) {
    const message = `
${getSignificanceBadge(article.significance)} from ${article.source}

📝${article.translatedTitle}

📖${article.translatedContent}

🌟Significance: ${article.significance}

🏷️${article.tags.length ? article.tags.join(',') : ''}

🔗Read original article: ${article.url}
`.trim();

    try {
        await bot.sendMessage(channelId, message, {parse_mode: "Markdown"});
        console.log('The article sent successfully');
    } catch (error) {
        console.error('Error while sending to Telegram:', error);
    }
}

function getSignificanceBadge(significance: string): string {
    switch (significance.toLowerCase()) {
        case 'high':
            return '🔥 IMPORTANT';
        case 'medium':
            return '✨ INTERESTING';
        case 'low':
            return '📌 UPDATE';
        default:
            return '🆕 NEW';
    }
}
