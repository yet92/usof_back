const {Op} = require("sequelize");
const {user} = require("../middlewares");
const {PostNotFound, CategoryNotFound} = require("../helpers/errors");

// TODO: add post status change action for admins and for users
// TODO: change id to postId where addLike, addPost, etc.

class PostsService {

    /**
     *
     * @param {typeof import('sequelize').Model} Post
     * @param {typeof import('sequelize').Model} Comment
     * @param {typeof import('sequelize').Model} Like
     * @param {typeof import('sequelize').Model} Category
     * @param pageSize
     */
    constructor({Post, Comment, Like, Category, pageSize = 10}) {
        this.Post = Post;
        this.Comment = Comment;
        this.Like = Like;
        this.Category = Category;
        this.pageSize = pageSize;
    }

    async getAll(pageNumber, userRole, userId) {
        if (userRole === 'admin') {
            return await this.Post.findAll({
                offset: pageNumber * this.pageSize,
                limit: this.pageSize,
            })
        } else {
            return await this.Post.findAll({
                where: {
                    [Op.or]: [
                        {author_id: userId},
                        {status: 'active'}
                    ],
                },
                offset: pageNumber * this.pageSize,
                limit: this.pageSize
            })
        }
    }

    async getPost(id, userRole, userId, {includeComments = false, includeCategories = false}) {

        const where = {
            id: id,
        }

        if (userRole !== 'admin') {
            where[Op.or] = [{
                status: 'active',
                author_id: userId
            }]
        }

        const include = [];

        if (includeComments) {
            include.push('comments');
        }

        if (includeCategories) {
            include.push('categories');
        }

        let post = this.Post.findOne({
            where,
            include
        });

        if (!post) {
            throw new PostNotFound(id);
        }
        return post;
    }

    async getComments(id, userRole, userId) {
        const post = await this.getPost(id, userRole, userId, true);

        return post.comments;
    }

    async addComment(id, authorId, content) {
        const post = await this.getPost(id, 'user', authorId);
        await post.addComment(
            await this.Comment.create({
                authorId: authorId,
                content: content
            })
        );

    }

    async getCategories(id, userRole, userId) {
        const post = await this.getPost(id, userRole, userId, {includeCategories: true});

        return post.categories;
    }

    async getLikes(id, userRole, userId) {
        const post = await this.getPost(id, userRole, userId);

        return await this.Like.findAll({
            where: {
                post_id: post.id
            }
        });
    }

    async #checkCategories(categoryIds) {
        const categories = [];
        for (const categoryId of categoryIds) {
            const category = await this.Category.findByPk(categoryId);
            if (!category) {
                throw new CategoryNotFound(categoryId);
            }
            categories.push(category);
        }

        return categories;
    }

    async createPost(userId, {
        title,
        content,
        categoryIds
                     }) {

        const categories = await this.#checkCategories(categoryIds);

        const post = this.Post.build({
            title,
            content,
            author_id: userId,
        });

       await Promise.all(categories.map(category => {
            return post.addCategory(category);
        }));

       await post.save();

    }

    async addLike(id, userRole, userId, likeType) {
        await this.getPost(id, userRole, userId);

        const like = await this.Like.findOne({
            where: {
                post_id: id,
                author_id: userId
            }
        });

        if (like) {
            like.type = likeType;
            await like.save();
        } else {
            await this.Like.create({
                post_id: id,
                author_id: userId,
                likeType: likeType
            })
        }

    }

    async updatePost(id, userId, {title, content, categoryIds}) {

        const post = await this.getPost(id, 'user', userId, {includeCategories: true});

        if (title) post.title = title;
        if (content) post.content = content;
        if (categoryIds)  {
            const categories = await this.#checkCategories(categoryIds);
            // TODO: setCategories?
            await post.setCategories(categories);
        }
        await post.save();

    }

    async deletePost(id, userId) {
        const post = await this.getPost(id, 'user', userId);
        await post.destroy();
    }

    async deleteLike(postId, userId) {
        const like = await this.Like.findOne({
            where: {
                post_id: postId,
                author_id: userId
            }
        });

        like && await like.destroy();
    }


}