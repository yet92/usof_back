const generateData = async (createUser, { Post, Like, Comment, Category }) => {
    const DEFAULT_USERS = require("./DEFAULT_USERS.json");
    const DEFAULT_CATEGORIES = require("./DEFAULT_CATEGORIES.json");
    const DEFAULT_POSTS = require("./DEFAULT_POSTS.json");
    const DEFAULT_COMMENTS = require("./DEFAULT_COMMENTS.json");
    const DEFAULT_LIKES = require("./DEFAULT_LIKES.json");

    for (const user of DEFAULT_USERS) {
        await createUser({
            login: user.login,
            email: user.email,
            password: user.password,
            role: "user",
            isEmailConfirmed: true,
        });
    }

    const categories = [];
    for (const category of DEFAULT_CATEGORIES) {
        categories.push(
            await Category.create({
                title: category.title,
                description: category.description,
            })
        );
    }

    for (const post of DEFAULT_POSTS) {
        const newPost = await Post.create({
            title: post.title,
            author_id: post.author_id,
            content: post.content,
        });
        if (post.categoryIds) {
            for (const categoryId of post.categoryIds) {
                await newPost.addCategory(categories[Number(categoryId) - 1]);
            }
        }
    }

    for (const comment of DEFAULT_COMMENTS) {
        const toComment = await Comment.findByPk(Number(comment.comment_id));

        if (toComment) {
            await toComment.addSelfComments(
                await Comment.create({
                    author_id: comment.author_id,
                    content: comment.content,
                })
            );
        } else {
            const post = await Post.findByPk(Number(comment.post_id));
            await post.addComment(
                await Comment.create({
                    author_id: comment.author_id,
                    content: comment.content,
                })
            );
        }
    }

    for (const like of DEFAULT_LIKES) {
        if (!like.comment_id) delete like.comment_id;
        else delete like.post_id;
        const newLike = await Like.create(like);
        await newLike.updateUserRating(like.type === 'like' ? 1 : -1);
    }
};

module.exports = { generateData };
