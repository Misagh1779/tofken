const token = '7892178079:AAFpdGBprjs378rXa5KK1swzfsxYj0ypy18';
const TelegramBot = require('node-telegram-bot-api');
const { default: axios } = require('axios');

const bot = new TelegramBot(token, { polling: true });
let waitingForSymbol = {};

async function getPrice(symbol) {
    try {
        const response = await axios.get(`https://api.nobitex.ir/market/orderbook/${symbol}`);
        const bestAsk = response.data?.orderbook?.asks?.[0]?.[0];
        return bestAsk ? parseFloat(bestAsk) : null;
    } catch (err) {
        console.error("خطا در دریافت قیمت:", err.message);
        return null;
    }
}

async function getPriceWithDollar(symbol) {
    const tomanPrice = await getPrice(symbol);
    const dollarPrice = await getPrice("USDTIRT");

    if (!tomanPrice || !dollarPrice) return null;

    const inDollar = (tomanPrice / dollarPrice).toFixed(2);
    return {
        toman: tomanPrice.toLocaleString("fa-IR"),
        dollar: inDollar
    };
}

bot.on("text", async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    let notcontrollerMessage = true;

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
                resize_keyboard: true
            }
        });
    }

    else if (userMessage === "🔎 جستجوی نماد دلخواه") {
        notcontrollerMessage = false;
        waitingForSymbol[chatId] = true;
        bot.sendMessage(chatId, "✅ لطفاً نماد مورد نظرت رو وارد کن (مثلاً: ADAIRT)");
    }

    else if (waitingForSymbol[chatId]) {
        notcontrollerMessage = false;
        const symbol = userMessage.toUpperCase();
        const price = await getPriceWithDollar(symbol);

        if (price) {
            bot.sendMessage(chatId, `💸 قیمت ${symbol}:\n${price.toman} تومان\n💵 حدوداً ${price.dollar} دلار`);
        } else {
            bot.sendMessage(chatId, `❌ نتونستم قیمت ${symbol} رو پیدا کنم.`);
        }

        waitingForSymbol[chatId] = false;
    }

    const symbolsMap = {
        "💰 بیت‌کوین": "BTCIRT",
        "💰 اتریوم": "ETHIRT",
        "💰 تتر": "USDTIRT",
        "💰 ترون": "TRXIRT",
        "💰 دوج‌کوین": "DOGEIRT",
        "💰 ریپل": "XRPIRT",
        "💰 بایننس‌کوین": "BNBIRT"
    };

    if (symbolsMap[userMessage]) {
        notcontrollerMessage = false;
        const symbol = symbolsMap[userMessage];
        const price = await getPriceWithDollar(symbol);

        if (price) {
            bot.sendMessage(chatId, `💸 قیمت ${userMessage.replace("💰 ", "")}:\n${price.toman} تومان\n💵 حدوداً ${price.dollar} دلار`);
        } else {
            bot.sendMessage(chatId, `❌ نتونستم قیمت ${symbol} رو پیدا کنم.`);
        }
    }

    if (notcontrollerMessage) {
        bot.sendMessage(chatId, '❗ دستور وارد شده قابل شناسایی نیست. لطفاً از گزینه‌های منو استفاده کن یا یه نماد معتبر مثل BTCIRT وارد کن.');
    }
});


