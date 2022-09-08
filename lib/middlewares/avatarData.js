/**
 *
 * @param {typeof import('sequelize').Model} User
 */
function useAvatarData({User}) {
    async function avatarData(req, res, next) {

        if (req.method === 'OPTIONS') {
            return next;
        }

        try {

            if (!req.user) {
                next();
            }

            console.log(req.body);

            if (req.body.targetUserId) {
                const targetUser = await User.findByPk(req.body.targetUserId);

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

        } catch (err) {}

        next();
    }

    return {avatarData};
}



module.exports = useAvatarData;
