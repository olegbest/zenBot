const newMessageLogic = require('./newMessageLogic').newMessage;
const DButils = require('./lib/DButils');
const methods = require('./controller/metods');
const request = require('request');
const fs = require('fs');
const cloudinary = require('./controller/cloudinary');
const sendMessage = require('./controller/sendMessage');

class Logic {
    constructor(bot) {
        this.api = bot.api;
        this.apiUser = bot.apiUser;
        this.sendM = new sendMessage.SendMessage(this.api);
        this.methods = new methods.Methods(bot.api, bot.apiApp, bot.apiUser, this.sendM);
        this.BotsLongPollUpdatesProvider = bot.BotsLongPollUpdatesProvider;
        this.group_id = bot.group_id;
        this.updates = new this.BotsLongPollUpdatesProvider(this.api, this.group_id);
        this.newMessage = new newMessageLogic(this.api, this.methods, this.sendM);
        this.apiApp = bot.apiApp;
        this.listen = bot.listen;
    }

    async start() {
        this.listen.on(async (ctx) => {
            console.log(ctx);
            let u = {
                object: ctx.message,
                group_id: this.group_id
            };
            if (u.object.text === "/restart") {
                await DButils.deleteUser(u.object.from_id);
            }
            await this.newMessage.logic(u);


        });

        this.listen.event("wall_reply_new", async (ctx) => {
            console.log(ctx);
            let u = {
                object: ctx.message,
                group_id: this.group_id
            };
            await this.methods.newComment(u.object.from_id, u.object.post_id)
        });
        // this.listen.event("wall_repost", async (ctx) => {
        //     console.log(ctx);
        //     let u = {
        //         object: ctx.message,
        //         group_id: this.group_id
        //     }
        //     await newCommentOrRepost(u.object.from_id, u.object.post_id, 'repost');
        // });

        this.listen.startPolling();
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
            await this.methods.updateLikeRepostAndComment(this.group_id);
        }, 60 * 1000);

        setInterval(async () => {
            let usersTimeToSend = await this.methods.checkTimeToSend(DButils);
            for (let i = 0; i < usersTimeToSend.length; i++) {
                setTimeout(async () => {
                    let u = usersTimeToSend[i];
                    let msg = {
                        object: Object.assign({}, u.info),
                    };
                    await this.newMessage.sendMessage(msg, u, u.state, u.day, undefined);
                }, 1000 * i)
            }
        }, 60 * 1000);

        setInterval(async () => {
            let link = await getImageGroup();
            await downloadFile(link);
            await this.methods.changePhotoGroup(__dirname + '/zenerit.png', this.group_id);
        }, 5 * 60 * 1000)
    }
}


async function downloadFile(link) {
    return await new Promise((resolve, reject) => {

        let r = request(link);

        r.on('response', function (res) {
            res.pipe(fs.createWriteStream(__dirname + '/zenerit.' + res.headers['content-type'].split('/')[1]), function () {

                resolve();
            });

        });
    })
}

async function getImageGroup() {
    let users = await DButils.getAllUsersWithSort({points: -1});
    if (users) {
        let user1 = await cloudinary.upload_img(users[0].info.photo_max_orig),
            user2 = await cloudinary.upload_img(users[1].info.photo_max_orig),
            user3 = await cloudinary.upload_img(users[2].info.photo_max_orig);
        user1 = await cloudinary.findFaceAndUploadImg(user1.public_id);
        user2 = await cloudinary.findFaceAndUploadImg(user2.public_id);
        user3 = await cloudinary.findFaceAndUploadImg(user3.public_id);

        let link = await cloudinary.getBackGround(
            {img: user1.public_id, text: (users[0].info.first_name + "\n" + (users[0].info.last_name || ""))},
            {img: user2.public_id, text: (users[1].info.first_name + "\n" + (users[1].info.last_name || ""))},
            {img: user3.public_id, text: (users[2].info.first_name + "\n" + (users[2].info.last_name || ""))},
        );
        return link;
    }
}


module.exports.logic = Logic;