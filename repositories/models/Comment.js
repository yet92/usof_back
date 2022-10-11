const {Model, DataTypes} = require('sequelize');

/**
 *
 * @param {Sequelize} sequelize
 * @param {typeof Model} User
 * @param {typeof Model} Post
 */
module.exports = (sequelize, User, Post) => {

    class Comment extends Model {
    }

    Comment.init({

        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            unique: true,
            primaryKey: true,
        },

        content: {
            type: DataTypes.TEXT,
            notNull: true
        }
    }, {sequelize, modelName: 'Comment', createdAt: 'publishDate'})


    Comment.belongsTo(User, {
        foreignKey: 'author_id',
        as: 'author'
    });

    const Post_Comments = sequelize.define('Post_Comments', {}, {timestamps: false});

    Post.belongsToMany(Comment, {through: Post_Comments, as: 'comments'});
    Comment.belongsToMany(Post, {through: Post_Comments, as: 'post'});

    return {Comment, Post_Comments}

}