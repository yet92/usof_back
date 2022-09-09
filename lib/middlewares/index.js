
const user = require('./user');
const useAvatarData = require('./avatarData');
const {useAvatarUpload} = require('./fileUpload');
const useCheckAuthTokenValidity = require('./checkAuthTokenValidity');

module.exports = {
    user,
    useAvatarData,
    useAvatarUpload,
    useCheckAuthTokenValidity
}
