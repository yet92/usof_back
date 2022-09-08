const bcrypt = require('bcrypt');
const {Op} = require("sequelize");

/**
 *
 * @param {typeof import('sequelize').Model} User
 * @return {{createUser: ((function({login: *, email: *, password: *, role: *}): Promise<*|undefined>)|*)}}
 */
function init({User}) {
    async function createUser({login, email, password, role = 'user', isEmailConfirmed = false}) {

        const checkUserUnique = await User.findOne({
            where: {
                [Op.or]: [
                    {login},
                    {email}
                ]
            }
        });

        if (checkUserUnique) {
            throw {
                name: 'Create User Error',
                message: checkUserUnique.login === login ? 'Login already in use' : 'Email already in use'
            };
        }

        const user = User.build({
            email,
            login,
            role,
            isEmailConfirmed
        });

        const salt = await bcrypt.genSalt(parseInt(process.env.SALT));
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        return user;
    }

    return {createUser}

}


module.exports = {
    init
}
