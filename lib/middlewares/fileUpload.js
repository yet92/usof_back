const multer = require("multer");
const path = require("path");

function useAvatarUpload(destination) {
    const avatarStorage = multer.diskStorage({
        destination,
        filename: function (req, file, cb) {
            if (req.avatarFileName) {
                const ext = path.extname(file.originalname);
                cb(null, `${req.avatarFileName}${ext}`);
            }
        }
    })

    const avatarUpload = multer({
        storage: avatarStorage, fileFilter: function (req, file, callback) {
            const ext = path.extname(file.originalname);
            if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
                return callback(new Error('Only images are allowed'))
            }
            callback(null, true)
        }
    });

    return {avatarUpload}
}

module.exports = {useAvatarUpload}