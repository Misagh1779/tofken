const token = '7892178079:AAFpdGBprjs378rXa5KK1swzfsxYj0ypy18';
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(token, { polling: true });

let waitingForSymbol = {};
let portfolios = {};
let waitingForAdd = {};

const mainKeyboard = {
  keyboard: [
    [{ text: "📋 لیست نمادها" }, { text: "🔎 جستجوی نماد" }],
    [{ text: "➕ افزودن دارایی" }, { text: "📊 سبد سرمایه" }],
    [{ text: "💰 بیت‌کوین" }, { text: "💰 اتریوم" }],
    [{ text: "💰 تتر" }, { text: "💰 ترون" }],
    [{ text: "💰 دوج‌کوین" }, { text: "💰 ریپل" }],
    [{ text: "💰 بایننس‌کوین" }]
  ],
  resize_keyboard: true
};

// تابع برای دریافت قیمت یک نماد
async function getPrice(symbol) {
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - 86400; // قیمت روز گذشته
    const response = await axios.get(`https://api.nobitex.ir/market/udf/history?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}`);
    if (response.data.s === 'ok') {
      const prices = response.data.c;
      return parseFloat(prices[prices.length - 1]);
    }
  } catch (err) {
    console.error(`خطا در دریافت قیمت ${symbol}:`, err.message);
  }
  return null;
}

// تابع برای دریافت قیمت به دلار
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

// لیست نمادهای قابل معامله
function getSymbolsListMessage() {
  const symbols = [
    { titleFa: "بیت‌کوین", symbol: "BTC" },
    { titleFa: "اتریوم", symbol: "ETH" },
    { titleFa: "تتر", symbol: "USDT" },
    { titleFa: "ترون", symbol: "TRX" },
    { titleFa: "دوج‌کوین", symbol: "DOGE" },
    { titleFa: "ریپل", symbol: "XRP" },
    { titleFa: "بایننس‌کوین", symbol: "BNB" },
    { titleFa: "کاردانو", symbol: "ADA" },
    { titleFa: "پولکادات", symbol: "DOT" },
    { titleFa: "لایت‌کوین", symbol: "LTC" },
    { titleFa: "شیبا", symbol: "SHIB" },
    { titleFa: "آوالانچ", symbol: "AVAX" }
  ];

  let message = "📋 لیست نمادهای قابل معامله:\n\n";
  symbols.forEach(({ titleFa, symbol }) => {
    message += `✅ ${titleFa} (${symbol}IRT)\n`;
  });
  return message;
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

// شروع کار با ربات
bot.on("text", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  if (userMessage === "/start") {
    bot.sendAnimation(chatId, 'CgACAgQAAxkBAAICgmggy5oVppxhVyCDr1gonAAB_zm90gACKh0AAjbACVGKm1-ckg61AzYE', {
      caption: "به ربات خوش اومدی 👋",
      reply_markup: mainKeyboard
    });
    return;
  }

  // دکمه‌های منو
  if (userMessage === "📋 لیست نمادها") {
    bot.sendMessage(chatId, getSymbolsListMessage());
    return;
  }

  if (userMessage === "🔎 جستجوی نماد") {
    waitingForSymbol[chatId] = true;
    bot.sendMessage(chatId, "🔍 لطفاً نماد مورد نظر رو وارد کن (مثلاً ADAIRT)");
    return;
  }

  if (userMessage === "➕ افزودن دارایی") {
    waitingForAdd[chatId] = { step: 1, data: {} };
    bot.sendMessage(chatId, "🔹 مرحله ۱: لطفاً نماد رو وارد کن (مثلاً: BTCIRT)");
    return;
  }

  if (userMessage === "📊 سبد سرمایه") {
    const userPortfolio = portfolios[chatId];
    if (!userPortfolio || userPortfolio.length === 0) {
      bot.sendMessage(chatId, "📭 سبد شما خالیه. از «➕ افزودن دارایی» استفاده کن.");
      return;
    }

    let message = "📊 وضعیت سبد:\n\n";
    let totalNow = 0;
    let totalBuy = 0;

    for (const item of userPortfolio) {
      const priceNow = await getPrice(item.symbol);
      if (!priceNow) continue;

      const valueNow = item.amount * priceNow;
      const valueBuy = item.amount * item.buyPrice;

      totalNow += valueNow;
      totalBuy += valueBuy;

      const diff = valueNow - valueBuy;
      const percent = ((diff / valueBuy) * 100).toFixed(2);
      const status = diff >= 0 ? "📈 سود" : "📉 ضرر";

      // محاسبه مقادیر به دلار و نمایش
      const valueNowInDollar = (valueNow / await getPrice("USDTIRT")).toFixed(2);
      const valueBuyInDollar = (valueBuy / await getPrice("USDTIRT")).toFixed(2);
      const diffInDollar = (diff / await getPrice("USDTIRT")).toFixed(2);

      message += `🔸 ${item.symbol} | ${item.amount} واحد\n`;
      message += `💰 فعلی: ${valueNowInDollar} دلار\n`;
      message += `${status}: ${diffInDollar} دلار (${percent}%)\n\n`;
    }

    const totalDiff = totalNow - totalBuy;
    const totalStatus = totalDiff >= 0 ? "📈 سود کلی" : "📉 ضرر کلی";

    message += `🧮 مجموع فعلی: ${(totalNow / await getPrice("USDTIRT")).toFixed(2)} دلار\n`;
    message += `💸 مجموع خرید: ${(totalBuy / await getPrice("USDTIRT")).toFixed(2)} دلار\n`;
    message += `${totalStatus}: ${(totalDiff / await getPrice("USDTIRT")).toFixed(2)} دلار`;

    bot.sendMessage(chatId, message);
    return;
  }

  // جستجوی نماد
  if (waitingForSymbol[chatId]) {
    const symbol = userMessage.toUpperCase();
    const price = await getPriceWithDollar(symbol);
    if (price) {
      bot.sendMessage(chatId, `💸 قیمت ${symbol}:\n${price.toman} تومان\n💵 ${price.dollar} دلار`);
    } else {
      bot.sendMessage(chatId, `❌ قیمت ${symbol} پیدا نشد.`);
    }
    waitingForSymbol[chatId] = false;
    return;
  }

  // مراحل افزودن دارایی
  if (waitingForAdd[chatId]) {
    const step = waitingForAdd[chatId].step;
    const data = waitingForAdd[chatId].data;

    if (step === 1) {
      data.symbol = userMessage.toUpperCase();
      waitingForAdd[chatId].step = 2;
      bot.sendMessage(chatId, "🔹 مرحله ۲: تعداد دارایی رو وارد کن (مثلاً: 0.5)");
    } else if (step === 2) {
      const amount = parseFloat(userMessage);
      if (isNaN(amount)) {
        bot.sendMessage(chatId, "❌ عدد وارد نشده. لطفاً فقط عدد وارد کن.");
        return;
      }
      data.amount = amount;
      waitingForAdd[chatId].step = 3;
      bot.sendMessage(chatId, "🔹 مرحله ۳: قیمت خرید هر واحد رو وارد کن (تومان)");
    } else if (step === 3) {
      const price = parseInt(userMessage);
      if (isNaN(price)) {
        bot.sendMessage(chatId, "❌ عدد وارد نشده. لطفاً فقط عدد وارد کن.");
        return;
      }
      data.buyPrice = price;

      if (!portfolios[chatId]) portfolios[chatId] = [];
      portfolios[chatId].push({
        symbol: data.symbol,
        amount: data.amount,
        buyPrice: data.buyPrice
      });

      bot.sendMessage(chatId, `✅ دارایی ${data.amount} ${data.symbol} با قیمت ${data.buyPrice.toLocaleString("fa-IR")} ثبت شد.`);
      waitingForAdd[chatId] = null;
    }
    return;
  }

  // پاسخ به دکمه‌های قیمت رمزارزها
  if (symbolsMap[userMessage]) {
    const symbol = symbolsMap[userMessage];
    const price = await getPriceWithDollar(symbol);
    if (price) {
      bot.sendMessage(chatId, `💰 قیمت ${userMessage.replace("💰 ", "")}:\n${price.toman} تومان\n💵 ${price.dollar} دلار`);
    } else {
      bot.sendMessage(chatId, `❌ قیمت ${symbol} پیدا نشد.`);
    }
    return;
  }
});

