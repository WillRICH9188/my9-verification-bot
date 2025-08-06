const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_INVITE_LINK = process.env.GROUP_INVITE_LINK;

if (!BOT_TOKEN || !GROUP_INVITE_LINK) {
  console.error('Error: Missing BOT_TOKEN or GROUP_INVITE_LINK in environment.');
  process.exit(1);
}

const LANG = {
  en: {
    welcome: '🔞 This service is for users aged 18 and above only.\nPlease confirm you agree to continue.',
    agree: '✅ I am 18+ and agree',
    ask_game_id: '🎮 Please enter your Game ID or Invite Code:',
    done: (link) => `🎉 Thanks! You can now join our VIP group:\n👉 ${link}`
  },
  hi: {
    welcome: '🔞 यह सेवा केवल 18 वर्ष और उससे अधिक आयु के उपयोगकर्ताओं के लिए है।\nकृपया पुष्टि करें कि आप जारी रखने के लिए सहमत हैं।',
    agree: '✅ मैं 18+ हूँ और सहमत हूँ',
    ask_game_id: '🎮 कृपया अपना गेम आईडी या आमंत्रण कोड दर्ज करें:',
    done: (link) => `🎉 धन्यवाद! अब आप हमारे VIP समूह में शामिल हो सकते हैं:\n👉 ${link}`
  }
};

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const users = {};

bot.onText(/\/start(?: (.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  users[chatId] = {
    telegram_id: chatId,
    username: msg.from.username || '',
    language: null,
    step: 'choose_language',
    timestamp: new Date().toISOString()
  };

  bot.sendMessage(chatId, '🌐 Please choose your language:\nकृपया अपनी भाषा चुनें:', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🇮🇳 हिन्दी', callback_data: 'lang_hi' },
          { text: '🇬🇧 English', callback_data: 'lang_en' }
        ]
      ]
    }
  });
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const u = users[chatId];

  if (!u) return;

  if (query.data === 'lang_hi' || query.data === 'lang_en') {
    u.language = query.data === 'lang_hi' ? 'hi' : 'en';
    u.step = 'confirm_age';

    const t = LANG[u.language];
    bot.sendMessage(chatId, t.welcome, {
      reply_markup: {
        inline_keyboard: [
          [{ text: t.agree, callback_data: 'agree' }]
        ]
      }
    });
    return;
  }

  if (u.step === 'confirm_age' && query.data === 'agree') {
    u.step = 'ask_game_id';
    const t = LANG[u.language || 'en'];
    bot.sendMessage(chatId, t.ask_game_id);
  }
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const u = users[chatId];
  if (!u || u.step !== 'ask_game_id') return;

  u.game_id = msg.text;
  u.step = 'done';
  fs.appendFileSync('users.json', JSON.stringify(u) + '\n');

  const t = LANG[u.language || 'en'];
  bot.sendMessage(chatId, t.done(GROUP_INVITE_LINK));
});
