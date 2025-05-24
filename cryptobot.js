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

// ✅ توابع قیمت
async function getPrice(symbol) {
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - 86400;
    const url = `https://api.nobitex.ir/market/udf/history?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}`;
    const response = await axios.get(url);
    if (response.data.s === 'ok') {
      const prices = response.data.c;
      return parseFloat(prices[prices.length - 1]);
    }
  } catch (err) {
    console.error(`❌ خطا در دریافت قیمت ${symbol}:`, err.message);
  }
  return null;
}

async function getPriceWithDollar(symbol) {
  const tomanPrice = await getPrice(symbol);
  const dollarPrice = await getPrice("USDTIRT");
  if (!tomanPrice || !dollarPrice) return null;

  return {
    toman: tomanPrice.toLocaleString("fa-IR"),
    dollar: (tomanPrice / dollarPrice).toFixed(2)
  };
}

function getSymbolsListMessage() {
  const symbols = [
    { titleFa: "بیت‌کوین", symbol: "BTCIRT" },
    { titleFa: "اتریوم", symbol: "ETHIRT" },
    { titleFa: "تتر", symbol: "USDTIRT" },
    { titleFa: "ترون", symbol: "TRXIRT" },
    { titleFa: "دوج‌کوین", symbol: "DOGEIRT" },
    { titleFa: "ریپل", symbol: "XRPIRT" },
    { titleFa: "بایننس‌کوین", symbol: "BNBIRT" },
    { titleFa: "کاردانو", symbol: "ADAIRT" },
    { titleFa: "پولکادات", symbol: "DOTIRT" },
    { titleFa: "لایت‌کوین", symbol: "LTCIRT" },
    { titleFa: "شیبا", symbol: "SHIBIRT" },
    { titleFa: "آوالانچ", symbol: "AVAXIRT" }
  ];
  let message = "📋 لیست نمادهای قابل معامله:\n\n";
  symbols.forEach(({ titleFa, symbol }) => {
    message += `✅ ${titleFa} (${symbol})\n`;
  });
  return message;
}

// ✅ نمادهای اصلاح‌شده
const symbolsMap = {
  "💰 بیت‌کوین": "BTCIRT",
  "💰 اتریوم": "ETHIRT",
  "💰 تتر": "USDTIRT",
  "💰 ترون": "TRXIRT",
  "💰 دوج‌کوین": "DOGEIRT",
  "💰 ریپل": "XRPIRT",
  "💰 بایننس‌کوین": "BNBIRT"
};

// ✅ پاسخ به پیام‌ها
bot.on("text", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  if (userMessage === "/start") {
    bot.sendMessage(chatId, "👋 به ربات قیمت ارز خوش آمدید!", { reply_markup: mainKeyboard });
    return;
  }

  if (userMessage === "📋 لیست نمادها") {
    bot.sendMessage(chatId, getSymbolsListMessage());
    return;
  }

  if (userMessage === "🔎 جستجوی نماد") {
    waitingForSymbol[chatId] = true;
    bot.sendMessage(chatId, "🔍 لطفاً نماد مورد نظر را وارد کنید (مثلاً ADAIRT)");
    return;
  }

  if (userMessage === "➕ افزودن دارایی") {
    waitingForAdd[chatId] = { step: 1, data: {} };
    bot.sendMessage(chatId, "🔹 مرحله ۱: لطفاً نماد را وارد کنید (مثلاً BTCIRT)");
    return;
  }

  if (userMessage === "📊 سبد سرمایه") {
    const userPortfolio = portfolios[chatId];
    if (!userPortfolio || userPortfolio.length === 0) {
      bot.sendMessage(chatId, "📭 سبد شما خالی است.");
      return;
    }

    const dollarRate = await getPrice("USDTIRT");
    let message = "📊 وضعیت سبد:\n\n";
    let totalNow = 0;
    let totalBuy = 0;

    for (const item of userPortfolio) {
      const priceNow = await getPrice(item.symbol);
      if (!priceNow) continue;

      const valueNow = item.amount * priceNow;
      const valueBuy = item.amount * item.buyPrice;
      const diff = valueNow - valueBuy;
      const percent = ((diff / valueBuy) * 100).toFixed(2);
      const status = diff >= 0 ? "📈 سود" : "📉 ضرر";

      message += `🔸 ${item.symbol} | ${item.amount} واحد\n`;
      message += `💰 فعلی: ${(valueNow / dollarRate).toFixed(2)} دلار\n`;
      message += `${status}: ${(diff / dollarRate).toFixed(2)} دلار (${percent}%)\n\n`;

      totalNow += valueNow;
      totalBuy += valueBuy;
    }

    const totalDiff = totalNow - totalBuy;
    const totalStatus = totalDiff >= 0 ? "📈 سود کلی" : "📉 ضرر کلی";

    message += `🧮 مجموع فعلی: ${(totalNow / dollarRate).toFixed(2)} دلار\n`;
    message += `💸 مجموع خرید: ${(totalBuy / dollarRate).toFixed(2)} دلار\n`;
    message += `${totalStatus}: ${(totalDiff / dollarRate).toFixed(2)} دلار`;

    bot.sendMessage(chatId, message);
    return;
  }

  if (waitingForSymbol[chatId]) {
    const symbol = userMessage.toUpperCase();
    const price = await getPriceWithDollar(symbol);
    if (price) {
      bot.sendMessage(chatId, `💸 قیمت ${symbol}:\n💵 ${price.dollar} دلار`);
    } else {
      bot.sendMessage(chatId, `❌ قیمت ${symbol} پیدا نشد.`);
    }
    waitingForSymbol[chatId] = false;
    return;
  }

  if (waitingForAdd[chatId]) {
    const step = waitingForAdd[chatId].step;
    const data = waitingForAdd[chatId].data;

    if (step === 1) {
      data.symbol = userMessage.toUpperCase();
      waitingForAdd[chatId].step = 2;
      bot.sendMessage(chatId, "🔹 مرحله ۲: مقدار دارایی را وارد کنید.");
    } else if (step === 2) {
      const amount = parseFloat(userMessage);
      if (isNaN(amount)) {
        bot.sendMessage(chatId, "❌ مقدار نامعتبر. لطفاً فقط عدد وارد کنید.");
        return;
      }
      data.amount = amount;
      waitingForAdd[chatId].step = 3;
      bot.sendMessage(chatId, "🔹 مرحله ۳: قیمت خرید هر واحد (به تومان) را وارد کنید.");
    } else if (step === 3) {
      const price = parseFloat(userMessage);
      if (isNaN(price)) {
        bot.sendMessage(chatId, "❌ قیمت نامعتبر. لطفاً فقط عدد وارد کنید.");
        return;
      }

      data.buyPrice = price;
      if (!portfolios[chatId]) portfolios[chatId] = [];
      portfolios[chatId].push({
        symbol: data.symbol,
        amount: data.amount,
        buyPrice: data.buyPrice
      });

      bot.sendMessage(chatId, `✅ دارایی ثبت شد:\n${data.amount} ${data.symbol} با قیمت خرید ${data.buyPrice} تومان`);
      waitingForAdd[chatId] = null;
    }
    return;
  }

  // دکمه‌های آماده
  if (symbolsMap[userMessage]) {
    const symbol = symbolsMap[userMessage];
    const price = await getPriceWithDollar(symbol);
    if (price) {
      bot.sendMessage(chatId, `💰 قیمت ${userMessage.replace("💰 ", "")}:\n💵 ${price.dollar} دلار`);
    } else {
      bot.sendMessage(chatId, `❌ قیمت ${symbol} پیدا نشد.`);
    }
  return; // ← مهم: اینجا هم return بگذار
  }

  // فقط در صورتی که هیچکدام از موارد بالا اجرا نشد، پیام خطا بده
  bot.sendMessage(chatId, "❌ پیام شما نامعتبر است. لطفاً از دکمه‌ها استفاده کنید یا طبق دستورالعمل عمل نمایید.");
});

