const { Sequelize, DataTypes, Model } = require("sequelize");

/**
 *
 * @param {Sequelize} sequelize
 * @param {typeof Model} User
 */
module.exports = (sequelize, User) => {
    class PasswordResetToken extends Model {}

    PasswordResetToken.init(
        {
            token: {
                type: DataTypes.STRING,
                notNull: true,
            },
        },
        {
            sequelize,
            modelName: "Password_Reset_Token",
        }
    );

    PasswordResetToken.belongsTo(User, {
        foreignKey: "user_id",
        as: "user",
    });

    return { PasswordResetToken };
};
