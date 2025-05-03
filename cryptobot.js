const TelegramBot = require('node-telegram-bot-api');
const token = '7892178079:AAFpdGBprjs378rXa5KK1swzfsxYj0ypy18';
const bot = new TelegramBot(token, { polling: true });
const { default: axios } = require('axios');

bot.on("text", async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    let notcontrollermessage = true;

    if (userMessage === "/start") {
        notcontrollermessage = false;
        bot.sendMessage(chatId, 'به ربات قیمت لحظه‌ای توفکن خوش اومدی خوشتیپ!', {
            reply_markup: {
                remove_keyboard: true // ✅ دکمه‌ها پاک می‌شن
            }
        });
    }

    if (notcontrollermessage) {
        bot.sendMessage(chatId, 'از دستورات موجود استفاده کن!', {
            reply_markup: {
                remove_keyboard: true // ✅ حتی برای پیام‌های دیگه هم پاک بشه
            }
        });
    }
});
