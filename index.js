const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_INVITE_LINK = process.env.GROUP_INVITE_LINK;

if (!BOT_TOKEN || !GROUP_INVITE_LINK) {
  console.error('Error: Missing BOT_TOKEN or GROUP_INVITE_LINK in environment.');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const users = {};

bot.onText(/\/start(?: (.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const ref = match[1] || 'direct';
  users[chatId] = {
    telegram_id: chatId,
    username: msg.from.username || '',
    language: msg.from.language_code,
    ref,
    step: 'confirm_age',
    timestamp: new Date().toISOString()
  };

  bot.sendMessage(chatId, `🔞 This service is for users aged 18 and above only.\nPlease confirm you agree to continue.`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ I am 18+ and agree', callback_data: 'agree' }]
      ]
    }
  });
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const u = users[chatId];
  if (u && u.step === 'confirm_age' && query.data === 'agree') {
    u.step = 'ask_game_id';
    bot.sendMessage(chatId, '🎮 Please enter your Game ID or Invite Code:');
  }
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const u = users[chatId];
  if (!u) return;
  if (u.step !== 'ask_game_id') return;

  u.game_id = msg.text;
  u.step = 'done';
  fs.appendFileSync('users.json', JSON.stringify(u) + '\n');

  bot.sendMessage(chatId, `🎉 Thanks! You can now join our VIP group:\n👉 ${GROUP_INVITE_LINK}`);
});
