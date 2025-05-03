const TelegramBot = require('node-telegram-bot-api');
const token = '7892178079:AAFpdGBprjs378rXa5KK1swzfsxYj0ypy18';
const bot = new TelegramBot(token, { polling: true });
const { default:axios } = require('axios');

bot.on("text",async (msg)=>{
    const chatId=msg.chat.pinned_message;
    const userMessage = msg.text;
    let notcontrollermessage = true;

    if (userMessage == "/start") {
        notcontrollermessage = false;
bot.sendMessage(chatId, 'به ربات قیمت لحظه ای توفکن خوش اومدی خوشتیپ!')


    }


    if (notcontrollermassage) {
        bot.sendMessage(chatId, 'از دستورات موجود استفاده کن!');
    }
})