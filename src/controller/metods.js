const request = require('request');
const fs = require('fs');

class Methods {
    constructor(api) {
        this.api = api;
    }

    async getPhotoMessage(image, userId) {
        let link = await this.api.call("photos.getMessagesUploadServer", {peer_id: userId});

        let serverResponse = await new Promise((resolve, reject) => {
            request.post({
                url: link.upload_url,
                formData: {photo: fs.createReadStream(image)}
            }, function (err, httpResponse, body) {
                if (err) {
                    return console.error('upload failed:', err);
                }
                resolve(body)
            })
        });
        serverResponse = JSON.parse(serverResponse);
        return await this.api.call("photos.saveMessagesPhoto", {
            photo: serverResponse.photo,
            server: serverResponse.server,
            hash: serverResponse.hash
        });


    }

    async changePhotoGroup(image, group_id) {
        let link = await this.api.call("photos.getOwnerCoverPhotoUploadServer", {group_id, crop_y2: 400, crop_x2: 1590});

        let serverResponse = await new Promise((resolve, reject) => {
            request.post({
                url: link.upload_url,
                formData: {photo: fs.createReadStream(image)}
            }, function (err, httpResponse, body) {
                if (err) {
                    return console.error('upload failed:', err);
                }
                resolve(body)
            })
        });
        serverResponse = JSON.parse(serverResponse);
        return await this.api.call("photos.saveOwnerCoverPhoto", {
            photo: serverResponse.photo,
            hash: serverResponse.hash
        });


    }

    async checkTimeToSend(DButils) {
        let result = [];
        let users = await DButils.getAllUsers();

        if (users) {
            for (let i = 0; i < users.length; i++) {
                let u = users[i];
                if (u.lastMessageDate) {
                    let lastDate = new Date(u.lastMessageDate);
                    lastDate.setHours(lastDate.getHours() + 24);
                    if (+new Date() > +lastDate) {
                        await DButils.updateUser(u.id, {
                            numberDay: u.numberDay + 1,
                            state: "state0",
                            day: `day${u.numberDay + 1}`,
                            lastMessageDate: new Date()
                        });
                        u = await DButils.findUser(u.id);

                        result.push(u);
                    }
                }
            }
        }

        return result;
    }
}

module.exports = {
    Methods
};