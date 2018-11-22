const newMessageLogic = require('./newMessageLogic').newMessage;
const DButils = require('./lib/DButils');
const methods = require('./controller/metods');

class Logic {
    constructor(bot) {
        this.api = bot.api;
        this.methods = new methods.Methods(bot.api);
        this.BotsLongPollUpdatesProvider = bot.BotsLongPollUpdatesProvider;
        this.group_id = bot.group_id;
        this.updates = new this.BotsLongPollUpdatesProvider(this.api, this.group_id);
        this.newMessage = new newMessageLogic(this.api, this.methods);
        this.apiApp = bot.apiApp;
        this.listen = bot.listen;
    }

    start() {
        // this.methods.changePhotoGroup(__dirname + '/test.jpg', this.group_id);
        this.listen.on(async (ctx) => {
            console.log(ctx);
            let u = {
                object: ctx.message,
                group_id: this.group_id
            }
            await this.newMessage.logic(u);
        });

        this.listen.event("wall_reply_new", async (ctx) => {
            console.log(ctx);
            let u = {
                object: ctx.message,
                group_id: this.group_id
            };
            await newCommentOrRepost(u.object.from_id, u.object.post_id, 'comments');
        });
        this.listen.event("wall_repost", async (ctx) => {
            console.log(ctx);
            let u = {
                object: ctx.message,
                group_id: this.group_id
            }
            await newCommentOrRepost(u.object.from_id, u.object.post_id, 'repost');
        });

        this.listen.startPolling()
        //
        // this.updates.getUpdates(async updates => {
        //     // console.log(updates);
        //     if (updates) {
        //         if (updates.length > 0) {
        //
        //             for (let i = 0; i < updates.length; i++) {
        //                 let u = updates[i];
        //                 switch (u.type) {
        //                     case 'message_new': {
        //                         console.log("new message");
        //                         await this.newMessage.logic(u);
        //                         break;
        //                     }
        //                     case 'wall_reply_new': { // коммент на пост
        //                         await newCommentOrRepost(u.object.from_id, u.object.post_id, 'comments');
        //                         break;
        //                     }
        //                     case 'wall_reply_delete': { //удалил коммент
        //                         break;
        //                     }
        //
        //                     case 'wall_repost': { //репост записи
        //                         await newCommentOrRepost(u.object.from_id, u.object.post_id, 'repost');
        //                         break;
        //                     }
        //
        //                     default: {
        //                         break;
        //                     }
        //
        //                 }
        //             }
        //         }
        //     }
        // });
        setInterval(async () => {
            let posts = await this.apiApp.call("wall.get", {owner_id: -this.group_id});
            if (posts) {
                if (posts.items) {
                    let items = posts.items;
                    for (let i = 0; i < items.length; i++) {
                        let it = items[i];
                        let likes = await getLikes(this.apiApp, this.group_id, it.id);
                        let post = await DButils.findPost(it.id);
                        if (!post || post === null) {
                            post = await DButils.newPost({
                                id: it.id,
                                comments: [],
                                likes: [],
                                repost: [],
                            })
                        }
                        if (likes.items.length > 0) {
                            for (let j = 0; j < likes.items.length; j++) {
                                let like = likes.items[j];
                                if (post.likes.indexOf(like) === -1) {
                                    let arrWithlikes = post.likes;
                                    arrWithlikes.push(like);
                                    await DButils.updatePost(post.id, {likes: arrWithlikes});
                                    let user = await DButils.findUser(like);
                                    if (user) {
                                        await DButils.updateUser(user.id, {points: user.points + 10});
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }, 30000);

        setInterval(async () => {
            let usersTimeToSend = await this.methods.checkTimeToSend(DButils);
            for (let i = 0; i < usersTimeToSend.length; i++) {
                let u = usersTimeToSend[i];
                let msg = {
                    object: Object.assign({}, u.info),

                };
                await this.newMessage.sendMessage(msg, u, u.state, u.day, undefined);
            }
        }, 6 * 1000);
    }


}


async function getLikes(api, group_id, post_id) {
    return await api.call("likes.getList", {owner_id: -group_id, type: "post", item_id: post_id});
}

async function newCommentOrRepost(user_id, post_id, type) {
    let post = await DButils.findPost(post_id);
    if (!post || post === null) {
        post = await DButils.newPost({
            id: post_id,
            comments: [],
            likes: [],
            repost: [],
        })
    }
    if (post[type].indexOf(user_id) === -1) {
        let arrWithComments = post[type];
        arrWithComments.push(user_id);
        let data = {};
        if (type === "comments") {
            data = {comments: arrWithComments};
        } else if (type === "repost") {
            data = {repost: arrWithComments}
        }
        await DButils.updatePost(post.id, data);
        let user = await DButils.findUser(user_id);
        if (user) {
            await DButils.updateUser(user.id, {points: user.points + 25});
        }
    }
}


module.exports.logic = Logic;