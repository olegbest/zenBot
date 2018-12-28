const newMessageLogic = require('./newMessageLogic').newMessage;
const DButils = require('./lib/DButils');
const methods = require('./controller/metods');
const request = require('request');
const fs = require('fs');
const cloudinary = require('./controller/cloudinary');
const sendMessage = require('./controller/sendMessage');
const states = require('./data/states');

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
        // this.listen.on(async (ctx) => {
        //     console.log(ctx);
        //     let u = {
        //         object: ctx.message,
        //         group_id: this.group_id
        //     };
        //     if (u.object.text === "/restart") {
        //         await DButils.deleteUser(u.object.from_id);
        //     }
        //     await this.newMessage.logic(u);
        //
        //
        // });
        //
        // this.listen.event("wall_reply_new", async (ctx) => {
        //     console.log(ctx);
        //     let u = {
        //         object: ctx.message,
        //         group_id: this.group_id
        //     };
        //     await this.methods.newComment(u.object.from_id, u.object.post_id)
        // });
        //
        // this.listen.startPolling();
        //
        // setInterval(async () => {
        //     await this.methods.updateLikeRepostAndComment(this.group_id);
        // }, 3 * 60 * 1000);
        //
        // setInterval(async () => {
        //     await sendNextDay(this.methods, this.newMessage)
        // }, 60 * 1000);
        //
        // setInterval(async () => {
        //     let infoImgGroup = await DButils.findCountMessage(2);
        //     if (infoImgGroup) {
        //         let nowDate = new Date();
        //         let lastDate = new Date(infoImgGroup.lastDateUpdate);
        //         lastDate.setHours(nowDate.getHours() + 24);
        //         if (nowDate > lastDate) {
        //             let link = await getImageGroup();
        //             await downloadFile(link);
        //             await wait(40 * 1000);
        //             await this.methods.changePhotoGroup(__dirname + '/zenerit.png', this.group_id);
        //             await DButils.updateCountMessage(2, {lastDateUpdate: new Date()})
        //         }
        //     }
        // }, 5 * 60 * 1000);
        //
        // setInterval(async () => { //проверка длительных сообщений
        //     let users = await DButils.getAllUsers();
        //
        //     if (users) {
        //         let numberUsers = users.length / 2;
        //         if (users.length === 1) {
        //             numberUsers = 1;
        //         }
        //         for (let i = 0; i < numberUsers; i++) {
        //             let u = users[i];
        //             let stateData = states[u.day];
        //             if (stateData) {
        //                 stateData = states[u.day][u.oldState];
        //                 if (stateData) {
        //                     if (u.lastMessageDate && stateData.isDbTime && u.state === "typing") {
        //                         console.log("Этап 3");
        //                         let lastDate = new Date(u.lastMessageDate);
        //                         lastDate.setMilliseconds(lastDate.getMilliseconds() + ((stateData.time || 240000) + 120000));
        //                         console.log(lastDate);
        //                         if (+new Date() > +lastDate) {
        //                             let msg = {
        //                                 object: {
        //                                     from_id: u.id
        //                                 }
        //                             };
        //                             console.log("Этап 4");
        //                             await DButils.updateUser(u.id, {lastMessageDate: new Date()});
        //                             await this.newMessage.sendMessage(msg, u, u.oldState, u.day, undefined);
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }, 3 * 60 * 1000);
        //
        setInterval(async () => {
            let countMessage = await DButils.findCountMessage(1);
            if (countMessage.lastDateUpdate) {
                let lastDate = new Date(countMessage.lastDateUpdate);
                lastDate.setMilliseconds(lastDate.getMilliseconds() + 1500);
                if (+new Date() > +lastDate) {
                    await DButils.updateCountMessage(countMessage.id, {count: 0, lastDateUpdate: new Date()})
                }
            }
        }, 1000)

        let users = await DButils.findByData({$or: [{$and: [{numberDay: 7}, {state: {$ne: "wait-next-day-1"}}]}, {numberDay: {$ne: 7}}]})
        console.log(users.length)
        if (users) {
            let date = new Date();
            for (let i = 0; i < users.length; i++) {
                setTimeout(async ()=> {
                    let u = users[i]
                    await DButils.updateUser(u.id, {
                        numberDay: 7,
                        state: "wait-next-day-1",
                        day: "day7"
                    });
                    await this.sendM.sendText(u, `${u.info.first_name}, к сожалению, пришло время прощаться. Мне жаль, что ты не успела закончить обучение😌, но, надеюсь, что знаний, которые ты почерпнула за эти несколько дней, тебе хватит, чтобы начать работу над собой. Помни: любой успех, любое достижение – только в твоих руках. Никогда не сдавайся, смело иди к своим целям и помни, что ты прекрасна! Я очень рада нашему знакомству!❤️  
Если тебе понравилось наше общение, можешь оставить свой отзыв здесь https://vk.com/topic-29686754_39152844\n\nПока, хороших тебе праздников!`)
                    console.log(users.length - i);
                }, i * 100)
            }
            console.log(date)
        }
    }
}


async function downloadFile(link) {
    return await new Promise((resolve, reject) => {

        let r = request(link);

        r.on('response', function (res) {
            res.pipe(fs.createWriteStream(__dirname + '/zenerit.' + res.headers['content-type'].split('/')[1]));
            resolve();

        });
    })
}

async function getImageGroup() {
    let users = await DButils.getAllUsersWithSort({pointsForDay: -1});
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


async function wait(ms) {
    return await new Promise(resolve => setTimeout(resolve, ms));
}

async function sendNextDay(methods, newMessage) {
    let usersTimeToSend = await methods.checkTimeToSend(DButils);
    let time = 70000;
    let cycleLengh = 20;
    if (usersTimeToSend.length < 25) {
        cycleLengh = usersTimeToSend.length;
    }
    for (let i = 0; i < cycleLengh; i++) {
        setTimeout(async () => {
            let u = usersTimeToSend[i];
            let msg = {
                object: Object.assign({}, u.info),
            };
            let userState = "state0";
            let userDay = `day${u.numberDay + 1}`;
            u = await DButils.findUser(u.id);
            await newMessage.sendMessage(msg, u, userState, userDay, undefined);
            await DButils.updateUser(u.id, {
                numberDay: u.numberDay + 1,
                state: userState,
                day: userDay,
                lastMessageDate: new Date(),
                pointsForDay: 0
            });
            time += 1000;
        }, 1000 * (i + 1))
    }

}

module.exports.logic = Logic;