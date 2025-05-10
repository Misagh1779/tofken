const token = '7892178079:AAFpdGBprjs378rXa5KK1swzfsxYj0ypy18';
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(token, { polling: true });
const { default: axios } = require('axios');
let SymbolsMessage="";
let waitingForSymbol = {};

function splitMessage(message, maxLength = 4000) {
    const parts = [];
    while (message.length > 0) {
        parts.push(message.slice(0, maxLength));
        message = message.slice(maxLength);
    }
    return parts;
}



    async function getSymbolsListMessage(){
        SymbolsMessage="";
        const response= await axios.get("https://api.nobitex.net/v2/orderbook/all");
    
    for (const symbol in response.data){
        SymbolsMessage += `${symbol }
        
        `
      }
  console.log("Symbols fetched")
  return SymbolsMessage
}

getSymbolsListMessage()
    

async function getprice(symbol) {

  const to = Math.floor(Date.now() / 1000);

  const from = to - 86400

const response = await axios.get (`https://api.nobitex.ir/market/udf/history?symbol=${symbol}&resolution=D&from=${from}&to=${to}`);

console.log(response.data)
if (response.data["s"] == "ok") {
return response.data["c"]

}
}

const checkingSymbolregex= /irt$/i;

bot.on("text", async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    let notcontrollerMessage = true;
if (notcontrollerMessage) {
    bot.sendMessage(chatId, '❗ دستور وارد شده قابل شناسایی نیست. لطفاً از گزینه‌های موجود در منو استفاده کن یا یک نماد معتبر مثل BTCIRT وارد کن.');
}

    if (userMessage === "/start") {
        notcontrollerMessage = false;
        bot.sendMessage(chatId, 'به ربات قیمت لحظه‌ای توفکن خوش اومدی خوشتیپ!', {
            reply_markup: {
                keyboard: [
                    [{ text: "🔎 جستجوی نماد دلخواه" }],
                    [{ text: "📋 لیست نمادها" }],
                    [{ text: "💰 بیت‌کوین" }, { text: "💰 اتریوم" }],
                    [{ text: "💰 تتر" }, { text: "💰 ترون" }],
                    [{ text: "💰 ریپل" }, { text: "💰 دوج‌کوین" }],
                    [{ text: "💰 بایننس‌کوین" }]
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        });
    }

    else if (userMessage === "💰 بیت‌کوین") {
    notcontrollerMessage = false;
    const price = await getprice("BTCIRT");
    bot.sendMessage(chatId, `💸 قیمت بیت‌کوین: ${price} تومان`);
}

else if (userMessage === "💰 اتریوم") {
    notcontrollerMessage = false;
    const price = await getprice("ETHIRT");
    bot.sendMessage(chatId, `💸 قیمت اتریوم: ${price} تومان`);
}

else if (userMessage === "💰 تتر") {
    notcontrollerMessage = false;
    const price = await getprice("USDTIRT");
    bot.sendMessage(chatId, `💸 قیمت تتر: ${price} تومان`);
}

else if (userMessage === "💰 ترون") {
    notcontrollerMessage = false;
    const price = await getprice("TRXIRT");
    bot.sendMessage(chatId, `💸 قیمت ترون: ${price} تومان`);
}

else if (userMessage === "💰 دوج‌کوین") {
    notcontrollerMessage = false;
    const price = await getprice("DOGEIRT");
    bot.sendMessage(chatId, `💸 قیمت دوج‌کوین: ${price} تومان`);
}

else if (userMessage === "💰 ریپل") {
    notcontrollerMessage = false;
    const price = await getprice("XRPIRT");
    bot.sendMessage(chatId, `💸 قیمت ریپل: ${price} تومان`);
}

else if (userMessage === "💰 بایننس‌کوین") {
    notcontrollerMessage = false;
    const price = await getprice("BNBIRT");
    bot.sendMessage(chatId, `💸 قیمت بایننس‌کوین: ${price} تومان`);
}


    else if (userMessage === "🔎 جستجوی نماد دلخواه") {
        notcontrollerMessage = false;
        waitingForSymbol[chatId] = true;
        bot.sendMessage(chatId, "✅ لطفاً نماد مورد نظرت رو وارد کن (مثلاً: ADAIRT)");
    }

    else if (waitingForSymbol[chatId]) {
        notcontrollerMessage = false;
        const symbol = userMessage.toUpperCase();
        const price = await getprice(symbol);

        if (price) {
            bot.sendMessage(chatId, `💸 قیمت ${symbol}: ${price} تومان`);
        } else {
            bot.sendMessage(chatId, `❌ نتونستم قیمت ${symbol} رو پیدا کنم.`);
        }

        waitingForSymbol[chatId] = false;
    }


});
