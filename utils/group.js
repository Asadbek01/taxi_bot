const { Telegraf } = require('telegraf');
const axios = require('axios');
require("dotenv").config();
const token = '6778329671:AAEviqWYtx9Z6FWYr0F_lADf73fs3sbaj6I';
const groupUsername = 'yolovchiborchat';
const apiUrl = `https://api.telegram.org/bot${token}/getChat`;
const bot = new Telegraf(token, { username: '@havoyollari_bot', mention: true });
// Listen for messages in any group the bot is part of

axios.post(apiUrl, { chat_id: `@${groupUsername}` })
  .then(response => {
    const groupData = response.data.result;
    const groupId = groupData.id;
    console.log(`The group ID of '${groupUsername}' is ${groupId}`);
    
    // Register middleware to listen for messages in the fetched group
    bot.use((ctx, next) => {
        if (ctx.chat && ctx.chat.id === groupId) {
            console.log(`Received message in group ${groupId}: ${ctx.message.text}`);
            // Add your logic to handle the received message here
        }
        // Pass the control to the next middleware
        next();
    });
    
    // Start polling
    bot.startPolling();
  })
  .catch(error => {
    console.error('Error fetching group information:', error);
  }); 