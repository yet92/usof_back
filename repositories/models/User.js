const {Sequelize, DataTypes, Model} = require('sequelize');

/**
 *
 * @param {Sequelize} sequelize
 */
module.exports = (sequelize) => {

    class User extends Model {
    }

    User.init({

        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            unique: true,
            primaryKey: true,
        },

        login: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        password: {
            type: DataTypes.STRING(300),
            allowNull: false,
        },

        fullName: {
            type: DataTypes.STRING,
            field: 'full_name',
            defaultValue: ''
        },

        email: {
            type: DataTypes.STRING,
            unique: true,
            validate: {
                isEmail: true,
            },
        },

        profilePicture: {
            type: DataTypes.STRING,
            field: 'profile_picture_url',
            defaultValue: '/defaultProfilePicture.png'
        },

        rating: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        role: {
            type: DataTypes.STRING,
            validate: {
                isIn: [['admin', 'user']]
            },
            defaultValue: 'user',
        },

        isEmailConfirmed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_email_confirmed',
        }

    }, {
        sequelize,
        modelName: 'User',
        timestamps: false
    })

    return User;
}


