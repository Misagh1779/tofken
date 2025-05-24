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
    [{ text: "🔄 ریفرش سبد" }],
    [{ text: "💰 بیت‌کوین" }, { text: "💰 اتریوم" }],
    [{ text: "💰 تتر" }, { text: "💰 ترون" }],
    [{ text: "💰 دوج‌کوین" }, { text: "💰 ریپل" }],
    [{ text: "💰 بایننس‌کوین" }]
  ],
  resize_keyboard: true
};

function normalizeSymbol(symbol) {
  if (symbol.endsWith("USD") && !symbol.endsWith("USDT")) {
    return symbol.slice(0, -3) + "USDT";
  }
  return symbol;
}

async function getPrice(symbol) {
  try {
    symbol = normalizeSymbol(symbol);
    const to = Math.floor(Date.now() / 1000);
    const from = to - 86400;
    const url = `https://api.nobitex.ir/market/udf/history?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}`;
    const response = await axios.get(url);
    if (response.data.s === 'ok') {
      const prices = response.data.c;
      return parseFloat(prices[prices.length - 1]);
    }
  } catch (err) {
    console.error(`خطا در دریافت قیمت ${symbol}:`, err.message);
  }
  return null;
}

async function getPriceWithDollar(symbol) {
  const dollarPrice = await getPrice(symbol);
  if (!dollarPrice) return null;

  let formattedPrice;
  if (dollarPrice >= 1) {
    formattedPrice = dollarPrice.toFixed(2);
  } else if (dollarPrice >= 0.01) {
    formattedPrice = dollarPrice.toFixed(4);
  } else {
    formattedPrice = dollarPrice.toFixed(6);
  }

  return {
    dollar: formattedPrice
  };
}


function getSymbolsListMessage() {
  const symbols = [
    { titleFa: "بیت‌کوین", symbol: "BTCUSDT" },
    { titleFa: "اتریوم", symbol: "ETHUSDT" },
    { titleFa: "تتر", symbol: "USDTUSDT" },
    { titleFa: "ترون", symbol: "TRXUSDT" },
    { titleFa: "دوج‌کوین", symbol: "DOGEUSDT" },
    { titleFa: "ریپل", symbol: "XRPUSDT" },
    { titleFa: "بایننس‌کوین", symbol: "BNBUSDT" },
    { titleFa: "کاردانو", symbol: "ADAUSDT" },
    { titleFa: "پولکادات", symbol: "DOTUSDT" },
    { titleFa: "لایت‌کوین", symbol: "LTCUSDT" },
    { titleFa: "شیبا", symbol: "SHIBUSDT" },
    { titleFa: "آوالانچ", symbol: "AVAXUSDT" }
  ];

  let message = "📋 لیست نمادهای قابل معامله:\n\n";
  symbols.forEach(({ titleFa, symbol }) => {
    message += `✅ ${titleFa} (${symbol})\n`;
  });
  return message;
}

const symbolsMap = {
  "💰 بیت‌کوین": "BTCUSDT",
  "💰 اتریوم": "ETHUSDT",
  "💰 تتر": "USDTUSDT",
  "💰 ترون": "TRXUSDT",
  "💰 دوج‌کوین": "DOGEUSDT",
  "💰 ریپل": "XRPUSDT",
  "💰 بایننس‌کوین": "BNBUSDT"
};

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

  if (userMessage === "📋 لیست نمادها") {
    bot.sendMessage(chatId, getSymbolsListMessage());
    return;
  }

  if (userMessage === "🔎 جستجوی نماد") {
    waitingForSymbol[chatId] = true;
    bot.sendMessage(chatId, "🔍 لطفاً نماد مورد نظر رو وارد کن (مثلاً ADAUSD)");
    return;
  }

  if (userMessage === "➕ افزودن دارایی") {
    waitingForAdd[chatId] = { step: 1, data: {} };
    bot.sendMessage(chatId, "🔹 مرحله ۱: لطفاً نماد رو وارد کن (مثلاً: BTCUSD)");
    return;
  }
  if (userMessage === "🔄 ریفرش سبد") {
  if (portfolios[chatId]) {
    portfolios[chatId] = []; // خالی کردن سبد سرمایه کاربر
    bot.sendMessage(chatId, "✅ سبد سرمایه شما پاک شد. حالا می‌توانید دارایی‌های جدید را از «➕ افزودن دارایی» وارد کنید.");
  } else {
    bot.sendMessage(chatId, "📭 سبد شما خالی است.");
  }
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
      const normalizedSymbol = normalizeSymbol(item.symbol);
      const priceNow = await getPrice(normalizedSymbol);
      if (!priceNow) {
        bot.sendMessage(chatId, `❌ قیمت ${normalizedSymbol} دریافت نشد!`);
        continue;
      }

      const valueNow = item.amount * priceNow;
      const valueBuy = item.amount * item.buyPrice;
      const diff = valueNow - valueBuy;
      const percent = ((diff / valueBuy) * 100).toFixed(2);
      const status = diff >= 0 ? "📈 سود" : "📉 ضرر";

      message += `🔸 ${item.symbol} | ${item.amount} واحد\n`;
      message += `💰 فعلی: ${valueNow.toFixed(2)} دلار\n`;
      message += `${status}: ${diff.toFixed(2)} دلار (${percent}%)\n\n`;

      totalNow += valueNow;
      totalBuy += valueBuy;
    }

    if (totalBuy === 0) {
      bot.sendMessage(chatId, "❌ مجموع قیمت خرید صفر است. لطفاً دارایی‌ها را با قیمت خرید صحیح وارد کنید.");
      return;
    }

    const totalDiff = totalNow - totalBuy;
    const totalStatus = totalDiff >= 0 ? "📈 سود کلی" : "📉 ضرر کلی";

    message += `🧮 مجموع فعلی: ${totalNow.toFixed(2)} دلار\n`;
    message += `💸 مجموع خرید: ${totalBuy.toFixed(2)} دلار\n`;
    message += `${totalStatus}: ${totalDiff.toFixed(2)} دلار`;

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
      bot.sendMessage(chatId, "🔹 مرحله ۲: تعداد دارایی رو وارد کن (مثلاً: 0.5)");
    } else if (step === 2) {
      const amount = parseFloat(userMessage);
      if (isNaN(amount)) {
        bot.sendMessage(chatId, "❌ عدد وارد نشده. لطفاً فقط عدد وارد کن.");
        return;
      }
      data.amount = amount;
      waitingForAdd[chatId].step = 3;
      bot.sendMessage(chatId, "🔹 مرحله ۳: قیمت خرید هر واحد رو وارد کن (دلار)");
    } else if (step === 3) {
      const price = parseFloat(userMessage);
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

      bot.sendMessage(chatId, `✅ دارایی ${data.amount} ${data.symbol} با قیمت خرید ${data.buyPrice.toFixed(2)} دلار ثبت شد.`);
      waitingForAdd[chatId] = null;
    }
    return;
  }

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
