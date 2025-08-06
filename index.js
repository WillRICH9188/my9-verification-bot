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
    welcome: '🔐 This service is for registered users aged 18 and above.\nPlease confirm to proceed.',
    agree: '✅ Yes, I am 18+ and agree',
    ask_game_id: '📩 Kindly enter your member code or access ID:',
    done: (link) => `✅ Thank you! You may now continue:\n👉 ${link}`
  },
  hi: {
    welcome: '🔐 यह सेवा केवल पंजीकृत 18+ उपयोगकर्ताओं के लिए है। कृपया आगे बढ़ने के लिए पुष्टि करें।',
    agree: '✅ हाँ, मैं 18+ हूँ और सहमत हूँ',
    ask_game_id: '📩 कृपया अपना सदस्य कोड या एक्सेस आईडी दर्ज करें:',
    done: (link) => `✅ धन्यवाद! अब आप अगले चरण पर जा सकते हैं:\n👉 ${link}`
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
