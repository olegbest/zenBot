const cloudinary = require('cloudinary');
const cfg = require('./../secret/cloudinary');

cloudinary.config({
    cloud_name: cfg.cloud_name,
    api_key: cfg.api_key,
    api_secret: cfg.api_secret
});

async function upload_img(img) {
    return await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload(img,
            function (error, result) {
                if (result) {
                    resolve(result)
                }
            });
    })
}

//
async function findFaceAndUploadImg(idImage) {
    let img = await cloudinary.image(idImage, {
        gravity: "faces",
        height: 145,
        radius: "max",
        width: 145,
        crop: "fill"
    });
    let link = img.match(/'(.*?)'/)[1];

    return await upload_img(link);
}

async function getBackGround(user1, user2, user3) {
    let img = await cloudinary.image("zen.png", {
        transformation: [
            {underlay: user1.img, x: -515, y: 54},
            {
                overlay: {
                    font_family: "Arial",
                    font_size: 18,
                    text: user1.text,
                    color: "#242424",
                    text_align: "center"
                },
                x: -515,
                y: 145
            },
            {underlay: user2.img, x: -370, y: 54},
            {
                overlay: {
                    font_family: "Arial",
                    font_size: 18,
                    text: user2.text,
                    color: "#242424",
                    text_align: "center"
                },
                x: -370,
                y: 145
            },
            {underlay: user3.img, x: -210, y: 54},
            {
                overlay: {
                    font_family: "Arial",
                    font_size: 18,
                    text: user3.text,
                    color: "#242424",
                    text_align: "center"
                },
                x: -210,
                y: 145
            },
        ]
    });
    let link = img.match(/'(.*?)'/)[1];
    return img.match(/'(.*?)'/)[1];
}


module.exports = {
    upload_img,
    findFaceAndUploadImg,
    getBackGround
}