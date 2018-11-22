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

module.exports = {api, BotsLongPollUpdatesProvider, apiApp, group_id: cfg.id_group};