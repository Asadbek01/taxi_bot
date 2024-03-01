const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const token = '6778329671:AAEviqWYtx9Z6FWYr0F_lADf73fs3sbaj6I';
const bot = new TelegramBot(token, { polling: true });
const groupIds = ["-1002049520803"];
let userStates = {};
const adminUserIds = ['1097215587', '1049942835'];

let continueSending = true; 
let intervalId; 

function isAdmin(msg, next) {
    const userId = msg.from.id.toString();
    if (adminUserIds.includes(userId)) {
        next();
    } else {
        bot.sendMessage(msg.chat.id, 'Please use the available commands or contact the admin for assistance.');
    }
}
 const confirmKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Confirm", callback_data: "confirm" }],
        [{ text: "Edit", callback_data: "edit" }],
      ],
    },
  };

function sendRepeatedMessage(state, chatIds) {
    if (continueSending) {
        const adMessage = "Habar har 1 minutda jo'natiladi! !\n";
        const message = formatAd(state);
        sendToGroups(message);
    } else {
        clearInterval(intervalId);
    }
}

bot.onText(/\/start/, (msg) => {
    continueSending = true; 
    const chatType = msg.chat.type;
    const chatId = msg.chat.id;
    continueSending = true; 
    if (chatType === 'group' || chatType === 'supergroup') {
        bot.sendMessage(chatId, "Sorry, this bot cannot be used in groups.");
        return;
    }
  const welcomeMessage =
    "Welcome to the trip bot! To start planning your trip, use the /trip command.";
  bot.sendMessage(chatId, welcomeMessage);
});

bot.onText(/\/tugatish/, (msg) => {
    const chatType = msg.chat.type;
    const chatId = msg.chat.id;
    if (chatType === 'group' || chatType === 'supergroup') {
        bot.sendMessage(chatId, "Sorry, this bot cannot be used in groups.");
        return;
    }
    isAdmin(msg, () => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, "Tugatish komandasi ishga tushdi. Safaringiz behatar bo'lsin");
        continueSending = false; 
        clearInterval(intervalId); 
        delete userStates[chatId];
    });
});


bot.onText(/\/trip/,  (msg) => {
    const chatType = msg.chat.type;
    const chatId = msg.chat.id;
    if (chatType === 'group' || chatType === 'supergroup') {
        bot.sendMessage(chatId, "Sorry, this bot cannot be used in groups.");
        return;
    }

    isAdmin(msg, () => {
        const chatId = msg.chat.id;
        if (!continueSending || !(chatId in userStates)) { 
          userStates[chatId] = { step: 1 }; // Set the initial step of the trip
          askQuestion(chatId, "Savol: *Qayerdan?*");
        } else {
          bot.sendMessage(chatId, "Yangi sayohat boshlash uchun avval /tugatish komandasi bilan e'lonni to'xtating.");
        }
    });
});

function askQuestion(chatId, question) {
  continueSending && bot.sendMessage(chatId, question, { parse_mode: "Markdown" });
}

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const state = userStates[chatId];
    if (data === "confirm") {
        const adMessage = "Sizning habaringiz har minutda guruhga jo'natiladi.✅ To'xtatish uchun /tugatish komandasini bering.\n";
        const message = formatAd(state);
        sendToGroups(message);
        bot.sendMessage(chatId, adMessage);
        delete userStates[chatId];

        intervalId = setInterval(() => {
            sendRepeatedMessage(state, [chatId]);
        }, 60000); 
    } else if (data === "edit") {
        state.step = 1;
        bot.sendMessage(chatId, "*Savol: Qayerdan?*", {
            parse_mode: "Markdown",
        });
    }
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  if (!userStates[chatId]) {
    return;
  }

  const state = userStates[chatId];
  if (state.step === 1) {
    state.slijishJoyi = msg.text;
    state.step = 2;
    bot.sendMessage(chatId, "Savol: *Qayerga?*", { parse_mode: "Markdown" });
  } else if (state.step === 2) {
    state.borishJoyi = msg.text;
    state.step = 3;
    bot.sendMessage(chatId, "Savol: *Moshina Turi?*", {
      parse_mode: "Markdown",
    });
  } else if (state.step === 3) {
    state.moshinaTuri = msg.text;
    state.step = 4;
    bot.sendMessage(chatId, "Savol: *Nechta odam kerak?*", {
      parse_mode: "Markdown",
    });
  } else if (state.step === 4) {
    state.odamSoni = msg.text;
    state.step = 5;
    bot.sendMessage(chatId, "Savol: *Oldi boshmi?*", {
      parse_mode: "Markdown",
    });
  } else if (state.step === 5) {
    state.oldiBoshmi = msg.text;
    state.step = 6;
    bot.sendMessage(chatId, "Savol: *Pochta olamizmi?*", {
      parse_mode: "Markdown",
    });
  } else if (state.step === 6) {
    state.pochta = msg.text;
    state.step = 7;
    bot.sendMessage(chatId, "Savol: *Nechchida yuramiz?*", {
      parse_mode: "Markdown",
    });
  } else if (state.step === 7) {
    state.aniqSoat = msg.text;
    state.step = 8;
    bot.sendMessage(chatId, "Savol: *Nomer kiriting!*", {
      parse_mode: "Markdown",
    });
  } else if (state.step === 8) {
    state.telRaqam = msg.text;
    state.step = 9;
    bot.sendMessage(
      chatId,
      "Kiritilgan ma'lumotni tekshiring?\n*" + formatAd(state) + "*",
      confirmKeyboard
    );
  }
});

function formatAd(state) {
  return `
  📍 *${state.slijishJoyi}*
  🌆 *${state.borishJoyi}*
  🚘 *${state.moshinaTuri}*
  👤 *${state.odamSoni}*
  🛋️ *${state.oldiBoshmi}*
  📦 *${state.pochta}*
  ⏰ *${state.aniqSoat}*\n\n
  📞 *${state.telRaqam}*`;
}







function sendToGroups(message) {
  groupIds.forEach((groupId) => {
    bot.sendMessage(groupId, message, { parse_mode: "Markdown" });
  });
}


bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;
    if (chatType === 'group' || chatType === 'supergroup') {
        bot.sendMessage(chatId, "Sorry, this bot cannot be used in groups.");
        return;
    }
    const helpMessage = "Mavjud komandalar:\n" +
        "/trip - Start planning your trip\n" +
        "/tugatish - Stop planning your trip\n";

    bot.sendMessage(chatId, helpMessage);
});


