const mongooseModels = require('./mongoose');
const userModel = mongooseModels.article_model_user;
const PostsModel = mongooseModels.article_model_post;
const MessagesModel = mongooseModels.article_model_message;
const CountMessageModel = mongooseModels.article_model_count_message;

module.exports = {

    async findUser(id) {
        return await userModel.findOne({"id": id});
    },

    async deleteUser(id) {
        return await userModel.deleteOne({"id": id})
    },

    async findByData(data) {
        return await userModel.find(data)
    },

    async getAllUsers() {
        return await userModel.find({});
    },

    async getAllUsersWithSort(sortParam) {
        return await userModel.find({}).sort(sortParam);
    },

    async newUser(data) {
        let user = new userModel(data);
        return await user.save();
    },

    async updateUser(id, data) {
        return await userModel.findOneAndUpdate({id: id}, data)
    },

    async newMessage(data) {
        let message = new MessagesModel(data);
        return await message.save();
    },

    async findPost(id) {
        return await PostsModel.findOne({"id": id});
    },

    async newPost(data) {
        let post = new PostsModel(data);
        return await post.save();
    },

    async updatePost(id, data) {
        return await PostsModel.findOneAndUpdate({id: id}, data)
    },
    async findCountMessage(id) {
        return await CountMessageModel.findOne({"id": id});
    },
    async updateCountMessage(id, data) {
        return await CountMessageModel.findOneAndUpdate({id: id}, data)
    },
};