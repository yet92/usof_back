const {Model, DataTypes} = require('sequelize');

/**
 *
 * @param {Sequelize} sequelize
 * @param {typeof Model} User
 * @param {typeof Model} Post
 * @param {typeof Model} Comment
 */
module.exports = (sequelize, User, Post, Comment) => {

    class Like extends Model {

        async updateUserRating(delta) {
            let author = null;
            let likedObj = null;
            if (this.post_id) {
                likedObj = await Post.findByPk(this.post_id);
            } else if (this.comment_id) {
                likedObj = await Comment.findByPk(this.comment_id);
            }
            if (likedObj) {
                author = await User.findByPk(likedObj.author_id);
                if (author) {
                    author.rating += delta;
                    await author.save();
                }

            }
        }

    }

    Like.init({

        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            unique: true,
            primaryKey: true,
        },

        type: {
            type: DataTypes.ENUM('like', 'dislike'),
        }

    }, {sequelize, modelName: 'Like', createdAt: 'publishDate'})

    Like.belongsTo(Post, {
        foreignKey: 'post_id',
        as: 'post',
        onDelete: 'cascade'
    });

    Like.belongsTo(Comment, {
        foreignKey: 'comment_id',
        as: 'comment',
        onDelete: 'cascade'
    });

    Like.belongsTo(User, {
        foreignKey: 'author_id',
        as: 'author',
        onDelete: 'cascade'
    });

    Like.beforeDestroy(async (instance) => {
        await instance.updateUserRating(instance.type === 'like' ? -1 : 1);
    });

    Like.beforeBulkDestroy(async () => {

            await instance.updateUserRating(instance.type === 'like' ? -1 : 1);
    });

    return {Like}

}