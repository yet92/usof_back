const { Sequelize, DataTypes, Model } = require("sequelize");

/**
 *
 * @param {Sequelize} sequelize
 */
module.exports = (sequelize) => {
    class Category extends Model {}

    Category.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                unique: true,
                primaryKey: true,
            },

            title: {
                type: DataTypes.STRING,
                notNull: true,
                unique: true,
            },

            description: {
                type: DataTypes.TEXT,
                notNull: true,
            },
        },
        {
            sequelize,
            timestamps: false,
        }
    );

    return Category;
};
