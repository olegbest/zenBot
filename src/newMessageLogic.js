const DButils = require('./lib/DButils');
const states = require('./data/states');

class newMessage {
    constructor(api, methods, sendM) {
        this.api = api;
        this.sendM = sendM;
        this.methods = methods;
    }

    async logic(msg) {

        let user = await getUser(msg, this.api);
        await DButils.newMessage({
            user_id: user.id,
            isBot: false,
            text: msg.object.text,
            dateCreate: new Date(),
            attachments: msg.object.attachments
        });
        await this.sendMessage(msg, user, user.state, user.day);
    }

    async sendMessage(msg, user, state, day, nextState) {

        let answerButton;
        let attachmentsUser;
        let txt;
        if (msg.object) {
            txt = msg.object.text;
            if (msg.object.payload) {
                try {
                    answerButton = JSON.parse(msg.object.payload);
                } catch (e) {
                    console.log(e);
                }
            }
            attachmentsUser = msg.object.attachments;
        }

        if (answerButton) {
            if (answerButton["point"]) {
                user = await DButils.updateUser(user.id, {
                    points: user.points + answerButton["point"],
                    pointsForDay: (user.pointsForDay || 0) + answerButton["point"]
                });
            }

            if (answerButton["nextS"]) {
                user = await DButils.updateUser(user.id, {state: answerButton["nextS"]});
                user = await DButils.findUser(user.id);
                delete msg.object.payload;
                if (user.state !== "wait-next-day-1") {
                    await this.sendMessage(msg, user, answerButton["nextS"], user.day, undefined);
                }
                return;
            }
        }
        if (state === "point-state-check") {
            await this.sendMessage(msg, user, "point-state", day, undefined);
            let next = "";
            if (user.pointsForDay < 45) {
                next = "point-state-1"
            } else if (user.pointsForDay >= 45 && user.pointsForDay < 75) {
                next = "point-state-2"
            } else if (user.pointsForDay >= 75) {
                next = "point-state-3"
            }
            if (day === "day3" || day === "day4" || day === "day5") {
                if (user.pointsForDay < 40) {
                    next = "point-state-1"
                } else if (user.pointsForDay >= 40 && user.pointsForDay < 75) {
                    next = "point-state-2"
                }
            }
            await this.sendMessage(msg, user, next, day, undefined);

        } else if (state !== "typing") {
            await DButils.updateUser(user.id, {state: "typing"});
            if (states[day]) {
                let dayData = states[day];
                if (dayData[state]) {
                    let s = dayData[state];
                    if (s.isCheck) {
                        if (s.isButton) {
                            await this.failedStateWithBtn(msg, user, state, user.oldState);
                            return;
                        }
                        if (s.isPhoto) {

                            if (attachmentsUser.length > 0) {
                                for (let i = 0; i < attachmentsUser.length; i++) {
                                    let att = attachmentsUser[i];
                                    if (att.type === "photo") {
                                        att = att.photo;
                                        console.log(att);
                                        delete msg.object.attachments;
                                        await this.sendMessage(msg, user, s.success, user.day, undefined);
                                        return;
                                    } else {
                                        await this.failedStateWithPhoto(user, state, user.oldState);
                                        return;
                                    }
                                }
                            } else {
                                await this.failedStateWithPhoto(user, state, user.oldState);
                                return;
                            }
                        }
                    }
                    if (s["textArray"]) {
                        await DButils.updateUser(user.id, {oldState: state});
                        let arrT = s["textArray"];
                        await this.sendM.sendTyping(user.id);
                        for (let i = 0; i < arrT.length; i++) {

                            let el = arrT[i];
                            nextState = el['nextState'] || nextState;
                            if (el.delayTime) {
                                await wait(el.delayTime);
                            }
                            let elText = el.value;
                            if (el.random) {
                                elText = el.value[Math.floor(Math.random() * el.value.length)]
                            }
                            try {
                                elText = elText.replace("{{first_name}}", user.info.first_name || "");
                                elText = elText.replace("{{points}}", user.pointsForDay || 0);
                            } catch (e) {
                                console.log(e)
                            }
                            if (el.points) {
                                user = await DButils.updateUser(user.id, {
                                    points: user.points + el.points,
                                    pointsForDay: (user.pointsForDay || 0) + el.points
                                });
                            }
                            if (el.type === "text") {
                                await this.sendM.sendText(user, elText);
                            } else if (el.type === "button") {
                                let buttons = [];

                                el.buttons.forEach(function (bt) {
                                    buttons.push([{
                                        action: {
                                            "type": "text",
                                            "payload": JSON.stringify(bt.payload),
                                            "label": bt.val
                                        },
                                        color: bt.color || "default"
                                    }])
                                });
                                await this.sendM.sendButton(user, elText, buttons);
                            } else if (el.type === "photo") {
                                let photo = await this.methods.getPhotoMessage(__dirname + el.photo);
                                console.log(photo);
                                let attach = "";
                                if (photo) {
                                    photo = photo[0];
                                    attach = `photo${photo.owner_id}_${photo.id}`;
                                }
                                await this.sendM.sendAttachment(user, elText, attach)
                            } else if (el.type === "doc") {
                                await this.sendM.sendAttachment(user, "", elText)
                            }

                            if (state !== "wait-next-day-1") {
                                await DButils.updateUser(user.id, {lastMessageDate: new Date()});
                                await DButils.newMessage({
                                    user_id: user.id,
                                    isBot: true,
                                    dateCreate: new Date(),
                                    text: elText,
                                });
                            }
                        }
                        await DButils.updateUser(user.id, {state: nextState});
                        if (s.autoState) {
                            user = await DButils.findUser(user.id);
                            await this.sendMessage(msg, user, user.state, day, undefined);
                            return
                        }
                    }
                }
            }
        }
    }

    async failedStateWithBtn(msg, user, state, stateWithButtons) {

        if (states[user.day]) {
            let failedState = states[user.day][state];
            let dayData = states[user.day];
            if (dayData[stateWithButtons]) {
                let stateBTN = dayData[stateWithButtons];
                if (stateBTN.textArray) {
                    let btn = stateBTN["textArray"][stateBTN["textArray"].length - 1];
                    if (btn) {
                        if (btn.type === "button") {
                            let buttons = [];
                            btn.buttons.forEach(function (bt) {
                                buttons.push([{
                                    action: {
                                        "type": "text",
                                        "payload": JSON.stringify(bt.payload),
                                        "label": bt.val
                                    },
                                    color: bt.color || "default"
                                }])
                            });
                            let text = failedState.value[Math.floor(Math.random() * failedState.value.length)];
                            await this.sendM.sendButton(user, text || btn.value, buttons);
                            await DButils.newMessage({
                                user_id: user.id,
                                isBot: true,
                                dateCreate: new Date(),
                                text: text,
                            })
                        }
                    }
                }
            }
        }
        await DButils.updateUser(user.id, {state});
    }

    async failedStateWithPhoto(user, state) {
        if (states[user.day]) {
            let s = states[user.day][state];
            if (s) {
                let text = s.value[Math.floor(Math.random() * s.value.length)];
                await this.sendM.sendText(user, text);
                await DButils.updateUser(user.id, {state});
                await DButils.newMessage({
                    user_id: user.id,
                    isBot: true,
                    dateCreate: new Date(),
                    text: text,
                })
            }
        }
    }

}

async function getUser(msg, api) {
    let userID = msg.object.from_id;
    let user = await DButils.findUser(userID);
    let userInfo = await api.call("users.get", {
        user_ids: userID,
        fields: ["bdate", "photo_max_orig", "country", "city", "verified", "sex", "online", "last_seen"]
    });
    if (!user || user === null) {
        let newUser = {
            id: userID,
            info: userInfo[0],
            state: "state0",
            day: "day1",
            points: 0,
            pointsForDay: 0,
            numberDay: 1,
            joinDate: new Date()
        };
        user = await DButils.newUser(newUser)
    }
    return user;
}

async function wait(ms) {
    return await new Promise(resolve => setTimeout(resolve, ms));
}


module.exports = {
    newMessage
};
