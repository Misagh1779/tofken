const TelegramBot = require('node-telegram-bot-api');

const token = '7892178079:AAFpdGBprjs378rXa5KK1swzfsxYj0ypy18';

const bot = new TelegramBot(token, {polling: true});

const regex = /^\/start$/;

bot.on('message', (msg) => {
    let tarif = false; // تعریف فقط یکبار اینجا
    
    const chatId = msg.chat.id;
    const userText = msg.text;

    if (regex.test(userText)) {  // از regex استفاده کن
        tarif = true;  // فقط مقدار بدیم، نه let جدید
        bot.sendMessage(chatId, "به توفکن خوش اومدی خوشتیپ!");
    }

    if (userText === 'salam') {
        tarif = true;
        bot.sendMessage(chatId, "چخبر خوشتیپ");
    }

    if (!tarif) {
        bot.sendMessage(chatId, "چی چی بیه؟");
    }
});

console.log("bot is started");
