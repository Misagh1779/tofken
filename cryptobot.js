const token = '7892178079:AAFpdGBprjs378rXa5KK1swzfsxYj0ypy18';
const TelegramBot = require('node-telegram-bot-api');
const { default: axios } = require('axios');

const bot = new TelegramBot(token, { polling: true });
let waitingForSymbol = {};

// دریافت قیمت آخرین روز برای نماد
async function getPrice(symbol) {
    try {
        const to = Math.floor(Date.now() / 1000);
        const from = to - 86400;
        const encodedSymbol = encodeURIComponent(symbol);

        const response = await axios.get(`https://api.nobitex.ir/market/udf/history?symbol=${encodedSymbol}&resolution=D&from=${from}&to=${to}`);

        if (response.data["s"] === "ok") {
            const prices = response.data["c"];
            return parseFloat(prices[prices.length - 1]);
        }
    } catch (err) {
        console.error(`خطا در دریافت قیمت ${symbol}:`, err.message);
    }

    return null;
}

// دریافت قیمت به تومان و دلار
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

// دریافت لیست نمادها
async function getSymbolsListMessage() {
    try {
        const response = await axios.get("https://api.nobitex.ir/market/coins");
        const symbols = response.data.coins;

        let message = "📋 لیست نمادهای قابل معامله:\n\n";

        symbols.forEach((coin) => {
            if (coin.tradePairs.includes("IRT")) {
                message += `✅ ${coin.titleFa} (${coin.symbol}IRT)\n`;
            }
        });

        return message;
    } catch (error) {
        console.error("خطا در دریافت لیست نمادها:", error.message);
        return "❌ خطا در دریافت لیست نمادها. لطفاً بعداً دوباره امتحان کن.";
    }
}

// هندل پیام‌ها
bot.on("text", async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    let notcontrollerMessage = true;

    // استارت
    if (userMessage === "/start") {
        notcontrollerMessage = false;
        bot.sendMessage(chatId, 'به ربات قیمت لحظه‌ای توفکن خوش اومدی خوشتیپ! 👋', {
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

    // لیست نمادها
    else if (userMessage === "📋 لیست نمادها") {
        notcontrollerMessage = false;
        const list = await getSymbolsListMessage();
        bot.sendMessage(chatId, list);
    }

    // جستجوی دلخواه
    else if (userMessage === "🔎 جستجوی نماد دلخواه") {
        notcontrollerMessage = false;
        waitingForSymbol[chatId] = true;
        bot.sendMessage(chatId, "✅ لطفاً نماد مورد نظرت رو وارد کن (مثلاً: ADAIRT)");
    }

    // پاسخ به نماد واردشده
    else if (waitingForSymbol[chatId]) {
        notcontrollerMessage = false;
        const symbol = userMessage.toUpperCase();

        if (!/^[A-Z0-9]+$/g.test(symbol)) {
            bot.sendMessage(chatId, "❌ نماد وارد شده معتبر نیست. فقط از حروف انگلیسی و اعداد بدون فاصله استفاده کن.");
            waitingForSymbol[chatId] = false;
            return;
        }

        const price = await getPriceWithDollar(symbol);

        if (price) {
            bot.sendMessage(chatId, `💸 قیمت ${symbol}:\n${price.toman} تومان\n💵 حدوداً ${price.dollar} دلار`);
        } else {
            bot.sendMessage(chatId, `❌ نتونستم قیمت ${symbol} رو پیدا کنم.`);
        }

        waitingForSymbol[chatId] = false;
    }

    // نمادهای از پیش تعریف‌شده
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

    // پیام پیش‌فرض
    if (notcontrollerMessage) {
        bot.sendMessage(chatId, '❗ دستور وارد شده قابل شناسایی نیست. لطفاً از منو استفاده کن یا یک نماد معتبر مثل BTCIRT وارد کن.');
    }
});
