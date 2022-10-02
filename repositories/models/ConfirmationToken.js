const {Sequelize, DataTypes, Model} = require('sequelize');

/**
 *
 * @param {Sequelize} sequelize
 * @param {typeof Model} User
 */
module.exports = (sequelize, User) => {

    class ConfirmationToken extends Model {
    }

    ConfirmationToken.init({
            token: {
                type: DataTypes.STRING,
                notNull: true
            }
        },
        {
            sequelize,
            modelName: 'Confirmation_Token',
        });

    ConfirmationToken.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });


    return {ConfirmationToken};

}