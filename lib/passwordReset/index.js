const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const {sendMail} = require("../mailer");

/**
 *
 * @param {typeof import('sequelize').Model} PasswordResetToken
 * @param {typeof import('sequelize').Model} AuthToken
 * @param {typeof import('sequelize').Model} User
 */
function init({PasswordResetToken, User, AuthToken}) {
    /**
     *
     * @param {import('sequelize').Model} user
     */
    async function createPasswordReset(user) {

        let token = crypto.randomBytes(32).toString("hex");

        while (await PasswordResetToken.findOne({
            where: {token}
        })) {
            token = crypto.randomBytes(32).toString("hex");
        }

        let passwordResetToken = PasswordResetToken.build({
            token
        });

        await passwordResetToken.setUser(user);
        await passwordResetToken.save();


        const message = `${process.env.BASE_URL}/api/auth/password-reset/${passwordResetToken.token}`;
        await sendMail(user.email, 'Reset your password', message);
    }

    async function resetPassword(token, newPassword) {
        const passwordResetToken = await PasswordResetToken.findOne({
            where: {token}
        });

        if (!passwordResetToken) {
            throw new Error('No such password reset token');
        }

        const user = await User.findByPk(passwordResetToken.user_id);

        if (!user) {
            throw new Error('User is not exists');
        }

        const salt = await bcrypt.genSalt(parseInt(process.env.SALT));
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        await passwordResetToken.destroy();

        await AuthToken.destroy({
            where: {
                user_id: user.id
            }
        });

    }

    return {createPasswordReset, resetPassword}

}

module.exports = {
    init
}
