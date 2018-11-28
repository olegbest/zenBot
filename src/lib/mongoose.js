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
    pointsForDay: {type: Number, required: false},
    lastMessageDate: {type: String, required: false}
};

const schemaPost = {
    id: {type: Number, required: true, unique: true},
    comments: Array,
    likes: Array,
    repost: Array,
    dayPost: Number
}

const schemaMessage = {
    user_id: {type: Number, required: true},
    isBot: {type: Boolean, required: true},
    text: String,
    attachments: Array
};

const countMessage = {
    id: {type: Number, required: true},
    count: {type: Number, required: true},
    lastDateUpdate: {type: String, required: false},
    info: String
};

const vk_bot = mongoose.createConnection(`mongodb://${cfg.user}:${cfg.pass}@81.90.180.52:27017/zenerit_vk?authSource=admin&w=1`, {useNewUrlParser: true});

const schema_user_bot = new mongoose.Schema(schemaUser);
const schema_user_post = new mongoose.Schema(schemaPost);
const schema_user_message = new mongoose.Schema(schemaMessage);
const schema_count_message = new mongoose.Schema(countMessage);

const article_model_user = vk_bot.model('User', schema_user_bot);
const article_model_post = vk_bot.model('posts', schema_user_post);
const article_model_message = vk_bot.model('messages', schema_user_message);
const article_model_count_message = vk_bot.model('number_messages', schema_count_message);

module.exports = {
    article_model_user,
    article_model_post,
    article_model_message,
    article_model_count_message
};