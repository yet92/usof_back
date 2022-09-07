const {Sequelize, DataTypes, Model} = require('sequelize');

/**
 *
 * @param {Sequelize} sequelize
 * @param {typeof Model} User
 */
module.exports = (sequelize, User) => {

    class AuthToken extends Model {
    }

    AuthToken.init({
            token: {
                type: DataTypes.STRING,
                notNull: true
            }
        },
        {
            sequelize,
            modelName: 'Auth_Token',
        });

    AuthToken.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });


    return {AuthToken};

}