const TelegramBot = require('node-telegram-bot-api');

// جایگزین توکن با توکن خودت
const token = '7892178079:AAFpdGBprjs378rXa5KK1swzfsxYj0ypy18';

const bot = new TelegramBot(token, { polling: true });

const regex = /^\/start$/;

bot.on('message', (msg) => {
    let tarif = false;
    const chatId = msg.chat.id;
    const userText = msg.text;

    if (userText === '/start') {
        tarif = true;
        bot.sendMessage(chatId, "به توفکن خوش اومدی خوشتیپ!", {
            reply_markup: {
                keyboard: [
                    ["سلام", "بای"],
                    ["تست1", "تست2"]
                ],
                resize_keyboard: true
            }
        });
    }

    if (userText === 'سلام') {
        tarif = true;
        bot.sendMessage(chatId, "چخبر خوشتیپ");
    }

    if (userText === 'بای') {
        tarif = true;
        bot.sendMessage(chatId, "خودتم بای");
    }

    if (userText === 'تست1') {
        tarif = true;
        bot.sendMessage(chatId, "تست بیر");
    }

    if (userText === 'تست2') {
        tarif = true;
        bot.sendMessage(chatId, "تست ایکی");
    }

    if (!tarif) {
        bot.sendMessage(chatId, "چی چی بیه؟");
    }
});

console.log("bot is started");

