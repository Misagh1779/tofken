const token = '7892178079:AAFpdGBprjs378rXa5KK1swzfsxYj0ypy18';
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(token, { polling: true });
const { default: axios } = require('axios');
let SymbolsMessage="";


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

    if (userMessage === "/start") {
    notcontrollerMessage = false;
    bot.sendMessage(chatId, 'به ربات قیمت لحظه‌ای توفکن خوش اومدی خوشتیپ!', {
        reply_markup: {
            keyboard: [
                [{ text: "📋 لیست نمادها" }],
                [{ text: "💰 قیمت بیت‌کوین" }, { text: "💰 قیمت اتریوم" }]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    });
}

else if (userMessage === "📋 لیست نمادها") {
    notcontrollerMessage = false;
    const message = await getSymbolsListMessage();
    const parts = splitMessage(message);
    for (const part of parts) {
        await bot.sendMessage(chatId, part);
    }
}

else if (userMessage === "💰 قیمت بیت‌کوین") {
    notcontrollerMessage = false;
    const price = await getprice("BTCIRT");
    bot.sendMessage(chatId, `💸 قیمت بیت‌کوین (BTCIRT): ${price} تومان`);
}

else if (userMessage === "💰 قیمت اتریوم") {
    notcontrollerMessage = false;
    const price = await getprice("ETHIRT");
    bot.sendMessage(chatId, `💸 قیمت اتریوم (ETHIRT): ${price} تومان`);
}


    else if (checkingSymbolregex.test(userMessage)) {
        notcontrollerMessage = false;
        const price = await getprice(userMessage);
        if (price) {
            bot.sendMessage(chatId, `قیمت نماد مورد نظر ${userMessage} معادل ${price} تومان است.`);
        } else {
            bot.sendMessage(chatId, "اطلاعاتی برای نماد مورد نظر یافت نشد.");
        }
    }

    if (notcontrollerMessage) {
        bot.sendMessage(chatId, 'از دستورات موجود استفاده کن!');
    }
});

