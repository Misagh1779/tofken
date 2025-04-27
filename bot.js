const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const token = '7892178079:AAFpdGBprjs378rXa5KK1swzfsxYj0ypy18';

// Create a bot that uses 'polling' to fetch new updates

const bot = new TelegramBot(token, {polling: true});

const regex = /^\/start$/

bot.on('message', (msg) => {
    let tarif=false;
    const chatId = msg.chat.id;

    const userText = msg.text;

    if(userText == '/start'){
        let tarif = true;
        bot.sendMessage(chatId," به توفکن خوش اومدی خوشتیپ!");
    }
   
    if(userText == 'salam'){
        let tarif = true;
        bot.sendMessage(chatId, "چخبر خوشتیپ");
    }
    if(!tarif) {
    bot.sendMessage(chatId, "چی چی بیه؟");
}

});

  console.log("bot is started");