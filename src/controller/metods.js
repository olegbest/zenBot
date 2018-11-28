const request = require('request');
const fs = require('fs');
const DButils = require('./../lib/DButils');
const postsData = require('./../data/posts');
const states = require('./../data/states');

class Methods {
    constructor(api, apiApp, apiUser, sendM) {
        this.api = api;
        this.apiApp = apiApp;
        this.apiUser = apiUser;
        this.sendM = sendM;
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
        let link = await this.api.call("photos.getOwnerCoverPhotoUploadServer", {
            group_id,
            crop_y2: 400,
            crop_x2: 1590
        });

        let serverResponse = await new Promise((resolve, reject) => {
            request.post({
                url: link.upload_url,
                formData: {photo: fs.createReadStream(__dirname + "/../" + image)}
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
                    if (+new Date() > +lastDate && states[u.day + 1]) {
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

    async getReposts(idGroup, idPost) {
        return await this.apiUser.call("wall.getReposts", {owner_id: -idGroup, post_id: idPost})
    }

    async getLikes(group_id, post_id, type) {
        return await this.apiApp.call("likes.getList", {owner_id: -group_id, type: type || "post", item_id: post_id});
    }

    async updateLikeRepostAndComment(id_group) {
        let arrPosts = postsData.posts;
        if (arrPosts) {
            for (let i = 0; i < arrPosts.length; i++) {
                let postData = arrPosts[i];
                let likes = await this.getLikes(id_group, postData.id, postData.type);
                let reposts = await this.getReposts(id_group, postData.id);
                let post = await DButils.findPost(postData.id);
                if (!post) {
                    post = await DButils.newPost({
                        id: postData.id,
                        comments: [],
                        likes: [],
                        repost: [],
                        dayPost: postData.day
                    });
                }

                // console.log(likes);
                // console.log(reposts);
                // console.log(post)

                if (likes) {
                    for (let j = 0; j < likes.items.length; j++) {
                        let like = likes.items[j];
                        let user = await DButils.findUser(like);
                        if (user) {
                            if (user.numberDay === post.dayPost) {
                                if (post.likes.indexOf(user.id) === -1) {
                                    let likesPost = post.likes;
                                    likesPost.push(user.id);
                                    await DButils.updatePost(post.id, {likes: likesPost});
                                    await DButils.updateUser(user.id, {points: user.points + 10});
                                    let text = postsData.doLike[Math.floor(Math.random() * postsData.doLike.length)];
                                    await this.sendM.sendText(user, text);
                                }
                            }
                        }
                    }
                }
                if (reposts) {
                    for (let j = 0; j < reposts.items.length; j++) {
                        let repost = reposts.items[j];
                        // console.log(repost);
                        let user = await DButils.findUser(repost.from_id);
                        if (user) {
                            if (user.numberDay === post.dayPost) {
                                if (post.repost.indexOf(user.id) === -1) {
                                    let repostPost = post.repost;
                                    repostPost.push(user.id);
                                    await DButils.updatePost(post.id, {repost: repostPost});
                                    await DButils.updateUser(user.id, {points: user.points + 10});
                                    let text = postsData.doRepost[Math.floor(Math.random() * postsData.doRepost.length)];
                                    await this.sendM.sendText(user, text);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    async newComment(user_id, post_id) {
        let post = await DButils.findPost(post_id);
        if (post) {
            let user = await DButils.findUser(user_id);
            if (user) {
                if (user.numberDay === post.dayPost) {
                    if (post.comments.indexOf(user_id) === -1) {
                        let arrWithComments = post.comments;
                        arrWithComments.push(user_id);
                        let data = {};
                        data = {comments: arrWithComments};
                        await DButils.updatePost(post.id, data);
                        await DButils.updateUser(user.id, {points: user.points + 10});
                        let text = postsData.doComment[Math.floor(Math.random() * postsData.doComment.length)];
                        await this.sendM.sendText(user, text);
                    }
                }
            }
        }
    }
}


module.exports = {
    Methods
};