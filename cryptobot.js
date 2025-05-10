const token = '7892178079:AAFpdGBprjs378rXa5KK1swzfsxYj0ypy18';
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(token, { polling: true });
const { default: axios } = require('axios');
let SymbolsMessage="";

   async function getSymbolsListMessage(chatId) {
    const response = await axios.get("https://api.nobitex.net/v2/orderbook/all");
    const symbols = Object.keys(response.data.orderbooks);
    
    let messageChunk = "";
    let allChunks = [];

    for (const symbol of symbols) {
        const line = `${symbol}\n`;

        if ((messageChunk + line).length > 4000) {  // کمی پایین‌تر از 4096 برای اطمینان
            allChunks.push(messageChunk);
            messageChunk = line;
        } else {
            messageChunk += line;
        }
    }

    // آخرین بخش رو هم اضافه کن
    if (messageChunk.length > 0) {
        allChunks.push(messageChunk);
    }

    for (const chunk of allChunks) {
        await bot.sendMessage(chatId, chunk);
    }

    console.log("Symbols sent in chunks.");
}


getSymbolsListMessage()
    
        bot.on("text", async (msg) => {
      const chatId = msg.chat.id;
    const userMessage = msg.text;
    let notcontrollerMessage = true;

    if (userMessage === "/start") {
          notcontrollerMessage = false;
          bot.sendMessage(chatId, 'به ربات قیمت لحظه‌ای توفکن خوش اومدی خوشتیپ!',{
              reply_markup: {
                keyboard: [
            [{ text: "لیست نمادها" }]
                ],
                resize_keyboard: true,
                one_time_keyboard: false

            }
        });
      }

      if (userMessage=="لیست نمادها"){
        notcontrollerMessage = false;
        await getSymbolsListMessage(chatId);
      }

      if (notcontrollerMessage) {
          bot.sendMessage(chatId, 'از دستورات موجود استفاده کن!'), {
              
              }
    ;
    }
        });
