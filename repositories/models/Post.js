const { Sequelize, DataTypes, Model } = require("sequelize");

/**
 *
 * @param {Sequelize} sequelize
 * @param {typeof Model} Category
 * @param {typeof Model} User
 */
module.exports = (sequelize, Category, User) => {
    class Post extends Model {
        async toggleStatus() {
            if (this.status === "inactive") {
                this.status = "active";
                this.publishDate = Sequelize.fn("now");
            } else {
                this.status = "inactive";
            }

            await this.save();
        }
    }

    Post.init(
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
            },

            publishDate: {
                type: DataTypes.DATE,
                field: "publish_date",
                defaultValue: Sequelize.fn("now"),
            },

            status: {
                type: DataTypes.STRING,
                validate: {
                    isIn: [["active", "inactive"]],
                },
                defaultValue: "active",
            },

            content: {
                type: DataTypes.TEXT,
                notNull: true,
            },
        },

        {
            sequelize,
            modelName: "Post",
        }
    );

    Post.belongsTo(User, {
        foreignKey: "author_id",
        as: "author",
    });

    const Post_Categories = sequelize.define(
        "Post_Categories",
        {},
        { timestamps: false }
    );

    Post.belongsToMany(Category, {
        through: Post_Categories,
        as: "categories",
    });
    Category.belongsToMany(Post, { through: Post_Categories, as: "posts" });

    return { Post, Post_Categories };
};
