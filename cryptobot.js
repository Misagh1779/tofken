// Telegram Bot with Inline Buttons for Portfolio Management
const token = '7892178079:AAFpdGBprjs378rXa5KK1swzfsxYj0ypy18';
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(token, { polling: true });
let waitingForSymbol = {};
let portfolios = {};

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

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendAnimation(chatId, 'CgACAgQAAxkBAAICgmggy5oVppxhVyCDr1gonAAB_zm90gACKh0AAjbACVGKm1-ckg61AzYE', {
    caption: "به ربات خوش اومدی 👋",
    reply_markup: {
      inline_keyboard: [
        [{ text: "➕ افزودن دارایی", callback_data: "add_asset" }],
        [{ text: "📊 مشاهده سبد سرمایه", callback_data: "show_portfolio" }],
        [{ text: "🔎 جستجوی نماد دلخواه", callback_data: "search_symbol" }],
        [{ text: "📋 لیست نمادها", callback_data: "show_list" }]
      ]
    }
  });
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === "add_asset") {
    bot.sendMessage(chatId, "✅ برای افزودن دارایی، دستور زیر را ارسال کن:\n`/add BTC 0.5 1500000000`", { parse_mode: "Markdown" });
  }

  if (data === "show_portfolio") {
    const userPortfolio = portfolios[chatId];
    if (!userPortfolio || userPortfolio.length === 0) {
      bot.sendMessage(chatId, "📭 سبد سرمایه شما خالی است. از دکمه افزودن دارایی استفاده کنید.");
      return;
    }
    let message = "📊 وضعیت سبد سرمایه:\n\n";
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
      message += `🔹 ${item.symbol} | ${item.amount} واحد\n💰 ارزش فعلی: ${valueNow.toLocaleString("fa-IR")} تومان\n${status}: ${diff.toLocaleString("fa-IR")} تومان (${percent}%)\n\n`;
    }

    const totalDiff = totalNow - totalBuy;
    const totalStatus = totalDiff >= 0 ? "📈 سود کلی" : "📉 ضرر کلی";
    message += `🧮 مجموع سرمایه فعلی: ${totalNow.toLocaleString("fa-IR")} تومان\n💸 مجموع قیمت خرید: ${totalBuy.toLocaleString("fa-IR")} تومان\n${totalStatus}: ${totalDiff.toLocaleString("fa-IR")} تومان`;

    bot.sendMessage(chatId, message);
  }

  if (data === "search_symbol") {
    waitingForSymbol[chatId] = true;
    bot.sendMessage(chatId, "✅ لطفاً نماد مورد نظرت رو وارد کن (مثلاً: ADAIRT)");
  }

  if (data === "show_list") {
    bot.sendMessage(chatId, getSymbolsListMessage());
  }

  bot.answerCallbackQuery(query.id);
});

bot.onText(/\/add (\w+) (\d+(\.\d+)?) (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const symbol = match[1].toUpperCase() + "IRT";
  const amount = parseFloat(match[2]);
  const buyPrice = parseFloat(match[4]);

  if (!portfolios[chatId]) portfolios[chatId] = [];
  portfolios[chatId].push({ symbol, amount, buyPrice });

  bot.sendMessage(chatId, `✅ ${amount} ${symbol} با قیمت خرید ${buyPrice.toLocaleString("fa-IR")} تومان اضافه شد.`);
});

bot.on("text", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  if (waitingForSymbol[chatId]) {
    const symbol = userMessage.toUpperCase();
    if (!/^[A-Z0-9]+$/g.test(symbol)) {
      bot.sendMessage(chatId, "❌ نماد معتبر نیست.");
      waitingForSymbol[chatId] = false;
      return;
    }
    const price = await getPriceWithDollar(symbol);
    if (price) {
      bot.sendMessage(chatId, `💸 قیمت ${symbol}:\n${price.toman} تومان\n💵 ${price.dollar} دلار`);
    } else {
      bot.sendMessage(chatId, `❌ نتونستم قیمت ${symbol} رو پیدا کنم.`);
    }
    waitingForSymbol[chatId] = false;
  }
});

