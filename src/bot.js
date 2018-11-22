let cfg = require('./secret/configBot');
const {VKApi, ConsoleLogger, BotsLongPollUpdatesProvider} = require('node-vk-sdk');
const api = new VKApi({
    token: cfg.token,
    logger: new ConsoleLogger()
});

const apiApp = new VKApi({
    token: cfg.token_application,
    logger: new ConsoleLogger()
});

const VkBot = require('node-vk-bot-api');

const bot = new VkBot(cfg.token);

module.exports = {api, BotsLongPollUpdatesProvider, apiApp, group_id: cfg.id_group, listen: bot};