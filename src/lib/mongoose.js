const mongoose = require('mongoose');
const cfg = require('./../secret/monogo')

const schemaUser = {
    id: {type: Number, required: true, unique: true},
    info: {type: Object},
    state: {type: String, required: false},
    oldState: {type: String, required: false},
    joinDate: {type: String, required: false},
    day: {type: String, default: "day1"},
    numberDay: {type: Number, required: false},
    points: {type: Number, required: false},
    lastMessageDate: {type: String, required: false}
};

const schemaPost = {
    id: {type: Number, required: true, unique: true},
    comments: Array,
    likes: Array,
    repost: Array,
}

const schemaMessage = {
    user_id: {type: Number, required: true},
    isBot: {type: Boolean, required: true},
    text: String,
    attachments: Array
};

const vk_bot = mongoose.createConnection(`mongodb://${cfg.user}:${cfg.pass}@localhost:27017/zenerit_vk`, {useNewUrlParser: true});

const schema_user_bot = new mongoose.Schema(schemaUser);
const schema_user_post = new mongoose.Schema(schemaPost);
const schema_user_message = new mongoose.Schema(schemaMessage);

const article_model_user = vk_bot.model('User', schema_user_bot);
const article_model_post = vk_bot.model('posts', schema_user_post);
const article_model_message = vk_bot.model('messages', schema_user_message);

module.exports = {
    article_model_user,
    article_model_post,
    article_model_message
};