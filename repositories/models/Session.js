const { Model, DataTypes } = require("sequelize");

/**
 *
 * @param {Sequelize} sequelize
 */
module.exports = (sequelize) => {
    class Session extends Model {}

    Session.init(
        {
            sid: {
                type: DataTypes.STRING,
                primaryKey: true,
                unique: true,
                allowNull: false,
            },
            data: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            expires: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            sequelize,
            updatedAt: false,
        }
    );

    return { Session };
};
