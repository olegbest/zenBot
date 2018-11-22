const methods = require('./metods').Methods;


class SendMessage {
    constructor(api) {
        this.api = api;
        this.methods = new methods(api);
    }

    async sendText(user, text) {
        let userID = user.id;
        return await this.api.call('messages.send', {
            message: text,
            peer_id: userID
        })
    }

    async sendAttachment(user, text, attachments){
        let userID = user.id;
        return await this.api.call('messages.send', {
            message: text,
            peer_id: userID,
            attachment: attachments
        })
    }

    async sendTyping(userID) {
       return await this.api.call('messages.setActivity', {
            type: "typing",
            peer_id: userID
        });
    }

    async sendButton(user, text, buttons) {
        let userID = user.id;
        await this.api.call('messages.send', {
            message: text,
            peer_id: userID,
            keyboard: JSON.stringify({
                one_time: true,
                buttons: buttons
            })
        })
    }

}

module.exports.SendMessage = SendMessage;