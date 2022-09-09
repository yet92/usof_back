/**
 *
 * @param {typeof import('sequelize').Model} User
 * @param {typeof import('sequelize').Model} AuthToken
 */
function useAvatarData({User, AuthToken}) {
    async function avatarData(req, res, next) {

        if (req.method === 'OPTIONS') {
            return next;
        }

        try {

            if (!req.user) {
                return res.status(401).json({
                    name: 'Upload Avatar Error',
                    message: 'Not Authorized'
                });
            }

            if (req.query.targetUserId) {
                const targetUser = await User.findByPk(req.query.targetUserId);

                if (!targetUser) {
                    return res.status(404).json({
                        name: 'Upload Avatar Error',
                        message: 'Target User Not Found'
                    })
                }

                if (targetUser.role === 'admin' && parseInt(targetUser.id) !== parseInt(req.user.id)) {
                    return res.status(403).json({
                        name: 'Upload Avatar Error',
                        message: 'Target User Is Admin'
                    })
                }

                req.avatarFileName = targetUser.id.toString();
            } else {
                req.avatarFileName = req.user.id.toString();
            }

        } catch (err) {
            next(err);
        }

        next();
    }

    return {avatarData};
}


module.exports = useAvatarData;
