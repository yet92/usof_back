const {Sequelize} = require('sequelize');
const mysql = require('mysql2/promise');

exports.init = async ({
                          host = 'localhost',
                          port = 3306,
                          user = 'root',
                          password = 'root',
                          database = 'usof'
                      }) => {

    try {
        const connection = await mysql.createConnection({host, port, user, password});
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);

        const sequelize = new Sequelize(database, user, password, {
            host,
            port,
            dialect: 'mysql'
        });
        await sequelize.authenticate();

        async function disconnect() {
            await sequelize.close();
            connection.end();
        }

        const User = require('./models/User')(sequelize);
        const Category = require('./models/Category')(sequelize);
        const {Post, Post_Categories} = require('./models/Post')(sequelize, Category, User);
        const {Comment, Post_Comments} = require('./models/Comment')(sequelize, User, Post);
        const {Like} = require('./models/Like')(sequelize, User, Post, Comment);
        const {ConfirmationToken} = require('./models/ConfirmationToken')(sequelize, User);
        const {AuthToken} = require('./models/AuthToken')(sequelize, User);
        const {PasswordResetToken} = require('./models/PasswordResetToken')(sequelize, User);

        await sequelize.sync({alter: true});


        console.log('Connection has been established successfully.');

        return {
            User, Category, Post, Post_Categories, Comment, Post_Comments, Like, ConfirmationToken, AuthToken, PasswordResetToken, disconnect
        };

    } catch (error) {
        console.error('Unable to connect to the database: ', error);
    }

}
