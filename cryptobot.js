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

// قیمت‌ها رو مستقیم از نمادهای دلار بگیرید (مثلاً BTCUSD و ...)
async function getPrice(symbol) {
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - 86400;
    const url = `https://api.nobitex.ir/market/udf/history?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}`;
    const response = await axios.get(url);
    if (response.data.s === 'ok') {
      const prices = response.data.c;
      return parseFloat(prices[prices.length - 1]); // قیمت به دلار
    }
  } catch (err) {
    console.error(`خطا در دریافت قیمت ${symbol}:`, err.message);
  }
  return null;
}

async function getPriceWithDollar(symbol) {
  const dollarPrice = await getPrice(symbol);
  if (!dollarPrice) return null;
  return {
    dollar: dollarPrice.toFixed(2)
  };
}

function getSymbolsListMessage() {
  const symbols = [
    { titleFa: "بیت‌کوین", symbol: "BTCUSD" },
    { titleFa: "اتریوم", symbol: "ETHUSD" },
    { titleFa: "تتر", symbol: "USDTUSD" },
    { titleFa: "ترون", symbol: "TRXUSD" },
    { titleFa: "دوج‌کوین", symbol: "DOGEUSD" },
    { titleFa: "ریپل", symbol: "XRPUSD" },
    { titleFa: "بایننس‌کوین", symbol: "BNBUSD" },
    { titleFa: "کاردانو", symbol: "ADAUSD" },
    { titleFa: "پولکادات", symbol: "DOTUSD" },
    { titleFa: "لایت‌کوین", symbol: "LTCUSD" },
    { titleFa: "شیبا", symbol: "SHIBUSD" },
    { titleFa: "آوالانچ", symbol: "AVAXUSD" }
  ];

  let message = "📋 لیست نمادهای قابل معامله:\n\n";
  symbols.forEach(({ titleFa, symbol }) => {
    message += `✅ ${titleFa} (${symbol})\n`;
  });
  return message;
}

const symbolsMap = {
  "💰 بیت‌کوین": "BTCUSD",
  "💰 اتریوم": "ETHUSD",
  "💰 تتر": "USDTUSD",
  "💰 ترون": "TRXUSD",
  "💰 دوج‌کوین": "DOGEUSD",
  "💰 ریپل": "XRPUSD",
  "💰 بایننس‌کوین": "BNBUSD"
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
    if (!priceNow) {
      bot.sendMessage(chatId, `❌ قیمت ${item.symbol} دریافت نشد!`);
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
  }
});
