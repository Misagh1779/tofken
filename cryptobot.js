const TelegramBot = require('node-telegram-bot-api');
const token = '7892178079:AAFpdGBprjs378rXa5KK1swzfsxYj0ypy18';
const bot = new TelegramBot(token, { polling: true });
const { default: axios } = require('axios');

async function getSymbolsListMessage() {
    const response = await axios.get("https://api.nobitex.net/v2/orderbook/all");
    return Object.keys(response.data.orderBook); // فقط اسم نمادها
}

bot.on("text", async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    let notControllerMessage = true;

    if (userMessage === "/start") {
        notControllerMessage = false;
        bot.sendMessage(chatId, 'به ربات قیمت لحظه‌ای توفکن خوش اومدی خوشتیپ!', {
            reply_markup: {
                keyboard: [
                    [{ text: "لیست نمادها" }]
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        });
    }

    if (userMessage === "لیست نمادها") {
        notControllerMessage = false;
        const symbols = await getSymbolsListMessage();
        bot.sendMessage(chatId, `نمادها:\n${symbols.join(', ')}`);
    }

    if (notControllerMessage) {
        bot.sendMessage(chatId, 'از دستورات موجود استفاده کن!');
    }
});
