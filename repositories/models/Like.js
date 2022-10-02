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

        async updateUserRating() {
            let author = null;
            let likedObj = null;
            if (this.post_id) {
                likedObj = await Post.findByPk(this.post_id);
            } else if (this.comment_id) {
                likedObj = await Comment.findBYPk(this.comment_id);
            }
            if (likedObj) {
                console.log(likedObj.toJSON());
                author = await User.findByPk(likedObj.author_id);
                if (author) {
                    author.rating += this.type === 'like' ? 1 : -1;
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
        as: 'post'
    });

    Like.belongsTo(Comment, {
        foreignKey: 'comment_id',
        as: 'comment'
    });

    Like.belongsTo(User, {
        foreignKey: 'author_id',
        as: 'author'
    });

    return {Like}

}