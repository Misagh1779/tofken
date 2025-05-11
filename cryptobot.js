require('dotenv').config();
const token = process.env.BOT_TOKEN;
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

// Function to get price in Toman
async function getPrice(symbol) {
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - 86400;
    const response = await axios.get(`https://api.nobitex.ir/market/udf/history?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}`);
    if (response.data.s === 'ok') {
      const prices = response.data.c;
      return parseFloat(prices[prices.length - 1]);
    }
  } catch (err) {
    console.error(`Error getting price for ${symbol}:`, err.message);
  }
  return null;
}

// Function to get price in USD
async function getPriceWithDollar(symbol) {
  const tomanPrice = await getPrice(symbol);
  const dollarPrice = await getPrice("USDTIRT");

  if (!tomanPrice || !dollarPrice) return null;

  const inDollar = (tomanPrice / dollarPrice).toFixed(2);
  return parseFloat(inDollar);
}

// Add Asset Flow in USD
bot.on("text", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  if (userMessage === "➕ افزودن دارایی") {
    waitingForAdd[chatId] = { step: 1, data: {} };
    bot.sendMessage(chatId, "🔹 مرحله ۱: لطفاً نماد را وارد کن (مثلاً: BTCIRT)");
    return;
  }

  if (waitingForAdd[chatId]) {
    const step = waitingForAdd[chatId].step;
    const data = waitingForAdd[chatId].data;

    if (step === 1) {
      data.symbol = userMessage.toUpperCase();
      waitingForAdd[chatId].step = 2;
      bot.sendMessage(chatId, "🔹 مرحله ۲: تعداد دارایی را وارد کن (مثلاً: 0.5)");
    } else if (step === 2) {
      const amount = parseFloat(userMessage);
      if (isNaN(amount)) {
        bot.sendMessage(chatId, "❌ لطفاً فقط عدد وارد کن.");
        return;
      }
      data.amount = amount;
      waitingForAdd[chatId].step = 3;
      bot.sendMessage(chatId, "🔹 مرحله ۳: قیمت خرید هر واحد را به دلار وارد کن");
    } else if (step === 3) {
      const price = parseFloat(userMessage);
      if (isNaN(price)) {
        bot.sendMessage(chatId, "❌ لطفاً فقط عدد وارد کن.");
        return;
      }
      data.buyPrice = price;

      if (!portfolios[chatId]) portfolios[chatId] = [];
      portfolios[chatId].push({
        symbol: data.symbol,
        amount: data.amount,
        buyPrice: data.buyPrice
      });

      bot.sendMessage(chatId, `✅ دارایی ${data.amount} ${data.symbol} با قیمت خرید ${data.buyPrice} دلار ثبت شد.`);
      waitingForAdd[chatId] = null;
    }
    return;
  }
});
