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
                console.log(result, error)
                if (result) {
                    resolve(result)
                }
            });
    })
}


let img = cloudinary.image("VowhVv6vXNg.jpg", {
    transformation: [
        {
            aspect_ratio: "1:1",
            background: "#262c35",
            border: "5px_solid_rgb:ff0000",
            gravity: "faces",
            height: 100,
            radius: "max",
            width: 235,
            crop: "crop"
        },
        {height: 200, overlay: "ramki107", width: 800, x: -85, crop: "scale"}
    ]
})
console.log(img);

