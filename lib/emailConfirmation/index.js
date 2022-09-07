const {Op} = require('sequelize');
const crypto = require('node:crypto');
const {sendMail} = require('../mailer');



/**
 *
 * @param {typeof import('sequelize').Model} ConfirmationToken
 * @param {typeof import('sequelize').Model} User
 */
function init(ConfirmationToken, User) {
    /**
     *
     * @param {import('sequelize').Model} user
     */
    async function createEmailConfirmation(user) {
        const confirmationToken = ConfirmationToken.build({
            token: crypto.randomBytes(32).toString("hex")
        });

        await confirmationToken.setUser(user);
        await confirmationToken.save();

        const message = `${process.env.BASE_URL}/api/verifyEmail/${user.id}/${confirmationToken.token}`;
        await sendMail(user.email, 'Verify Email', message);
    }

    async function confirmEmail(userId, token) {

        const confirmationToken = await ConfirmationToken.findOne({
            where: {
                [Op.and]: [
                    {user_id: userId},
                    {token: token}
                ]
            }
        });

        if (!confirmationToken) {
            throw new Error('Invalid confirm email data');
        }

        const user = await User.findOne({
            id: userId
        });

        user.isEmailConfirmed = true;

        await user.save();

        await confirmationToken.destroy();

    }

    return {createEmailConfirmation, confirmEmail}

}

module.exports = {
    init
}
