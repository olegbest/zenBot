const DButils = require('./../lib/DButils');


class SendMessage {
    constructor(api) {
        this.api = api;
    }

    async sendText(user, text) {
        let countMessage = await DButils.findCountMessage(1);
        countMessage = await DButils.updateCountMessage(countMessage.id, {count: countMessage.count + 1});
        if (countMessage) {
            while (countMessage.count > 25) {
                await wait(500);
                countMessage = await DButils.findCountMessage(countMessage.id);
            }
        }
        let userID = user.id;
        let res = await this.api.call('messages.send', {
            message: text,
            peer_id: userID
        });
        // countMessage = await DButils.findCountMessage(1);
        // await DButils.updateCountMessage(countMessage.id, {count: countMessage.count - 1});
        return res;
    }

    async sendAttachment(user, text, attachments) {
        let countMessage = await DButils.findCountMessage(1);
        countMessage = await DButils.updateCountMessage(countMessage.id, {count: countMessage.count + 1});
        if (countMessage) {
            while (countMessage.count > 25) {
                await wait(500);
                countMessage = await DButils.findCountMessage(countMessage.id);
            }
        }
        let userID = user.id;
        let res = await this.api.call('messages.send', {
            message: text,
            peer_id: userID,
            attachment: attachments
        });
        // countMessage = await DButils.findCountMessage(1);
        // await DButils.updateCountMessage(countMessage.id, {count: countMessage.count - 1});
        return res;
    }

    async sendTyping(userID) {
        try {
            return await this.api.call('messages.setActivity', {
                type: "typing",
                peer_id: userID
            });
        } catch (e) {
            console.log(e)
        }

    }

    async sendButton(user, text, buttons) {
        let countMessage = await DButils.findCountMessage(1);
        countMessage = await DButils.updateCountMessage(countMessage.id, {count: countMessage.count + 1});
        if (countMessage) {
            while (countMessage.count > 25) {
                await wait(500);
                countMessage = await DButils.findCountMessage(countMessage.id);
            }
        }
        let userID = user.id;
        let res = await this.api.call('messages.send', {
            message: text,
            peer_id: userID,
            keyboard: JSON.stringify({
                one_time: true,
                buttons: buttons
            })
        });
        // countMessage = await DButils.findCountMessage(1);
        // await DButils.updateCountMessage(countMessage.id, {count: countMessage.count - 1});
        return res;
    }

}

async function wait(ms) {
    return await new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.SendMessage = SendMessage;