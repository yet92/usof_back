const {Op} = require("sequelize");
const {user} = require("../middlewares");
const {PostNotFound, CategoryNotFound} = require("../helpers/errors");
const Joi = require('joi');
const {ValidationError} = require("express-validation");

// TODO: add post status change action for admins and for users
// TODO: change id to postId where addLike, addPost, etc.

const idSchema = Joi.number().min(1);
const userRoleSchema = Joi.string().valid('user', 'admin');
const likeTypeSchema = Joi.string().valid('like', 'dislike');
const contentSchema = Joi.string();
const categoryIdsSchema = Joi.array().items(idSchema);
const titleSchema = Joi.string().max(128);
const pageNumberSchema = Joi.number().min(0);


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

    /**
     *
     * @param {any} value
     * @param {Joi.Schema} schema
     */
    #validate(value, schema) {
        const result = schema.validate(value);
        if (result.error) {
            throw new ValidationError([result.error], {
                error: result.error,
                statusCode: 400
            });
        }
    }

    async getAll(pageNumber, userRole, userId) {

        if (!pageNumber) pageNumber = 0;

        this.#validate(pageNumber, pageNumberSchema);
        this.#validate(userRole, userRoleSchema.allow(undefined, null));
        this.#validate(userId, idSchema.allow(undefined, null));

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

        this.#validate(id, idSchema.required());
        this.#validate(userRole, userRoleSchema.allow(undefined, null));
        this.#validate(userId, idSchema.allow(undefined, null));

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

        this.#validate(id, idSchema.required());
        this.#validate(userRole, userRoleSchema.allow(undefined, null));
        this.#validate(userId, idSchema.allow(undefined, null));

        const post = await this.getPost(id, userRole, userId, true);

        return post.comments;
    }

    async addComment(id, authorId, content) {

        this.#validate(id, idSchema.required());
        this.#validate(authorId, idSchema.required());
        this.#validate(content, contentSchema.required());

        const post = await this.getPost(id, 'user', authorId);
        await post.addComment(
            await this.Comment.create({
                authorId: authorId,
                content: content
            })
        );

    }

    async getCategories(id, userRole, userId) {
        this.#validate(id, idSchema.required());
        this.#validate(userRole, userRoleSchema.allow(undefined, null));
        this.#validate(userId, idSchema.allow(undefined, null));

        const post = await this.getPost(id, userRole, userId, {includeCategories: true});

        return post.categories;
    }

    async getLikes(id, userRole, userId) {

        this.#validate(id, idSchema.required());
        this.#validate(userRole, userRoleSchema.allow(undefined, null));
        this.#validate(userId, idSchema.allow(undefined, null));


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

        this.#validate(userId, idSchema.required());
        this.#validate(title, titleSchema.required());
        this.#validate(content, contentSchema.required());
        this.#validate(categoryIds, categoryIdsSchema.required());

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

    async addLike(id, userId, likeType) {

        this.#validate(id, idSchema.required());
        this.#validate(userId, idSchema.required());
        this.#validate(likeType, likeTypeSchema.required());

        await this.getPost(id, 'user', userId);

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

        this.#validate(id, idSchema.required());
        this.#validate(userId, idSchema.required());
        this.#validate(title, titleSchema.allow(undefined, null));
        this.#validate(content, contentSchema.allow(undefined, null));
        this.#validate(categoryIds, categoryIdsSchema.allow(undefined, null));

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
        this.#validate(id, idSchema.required());
        this.#validate(userId, idSchema.required());
        const post = await this.getPost(id, 'user', userId);
        await post.destroy();
    }

    async deleteLike(postId, userId) {
        this.#validate(postId, idSchema.required());
        this.#validate(userId, idSchema.required());
        const like = await this.Like.findOne({
            where: {
                post_id: postId,
                author_id: userId
            }
        });

        like && await like.destroy();
    }

    async togglePostVisibility(id, userRole, userId) {
        this.#validate(id, idSchema.required());
        this.#validate(userId, idSchema.required());
        this.#validate(userRole, userRoleSchema.required());

        const post = await this.getPost(id, userRole, userId);

        if (!post) {
            throw new PostNotFound(id);
        }

        const newStatus = post.status === 'active' ? 'inactive' : 'active'

        post.status = newStatus;

        await post.save();

        return newStatus;

    }

}