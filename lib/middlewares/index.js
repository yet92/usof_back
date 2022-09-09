
const user = require('./user');
const useAdmin = require('./admin');
const useAvatarData = require('./avatarData');
const onlyAdmins = require('./onlyAdmins');
const {useAvatarUpload} = require('./fileUpload');
const useCheckAuthTokenValidity = require('./checkAuthTokenValidity');

module.exports = {
    user,
    useAdmin,
    onlyAdmins,
    useAvatarData,
    useAvatarUpload,
    useCheckAuthTokenValidity,
}
