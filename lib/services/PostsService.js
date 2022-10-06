const {Op} = require("sequelize");
const {user} = require("../middlewares");
const {PostNotFound, CategoryNotFound} = require("../helpers/errors");
const Joi = require('joi');
const {ValidationError} = require("express-validation");

const validationSchemas = require('../validation');
const {userRoleSchema} = require("../validation/userData");
const {logAsJSON} = require("../debug");
const {logger} = require("sequelize/lib/utils/logger");
const {valid} = require("joi");

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

    /**
     *
     * @param {any} value
     * @param {Joi.Schema} schema
     */
    #validate(value, schema) {
        const result = schema.validate(value);
        if (result.error) {
            throw new ValidationError([result.error], {
                error: result.error, statusCode: 400
            });
        }
    }

    async getAll(pageNumber, userRole, userId) {

        if (!pageNumber) pageNumber = 0;

        this.#validate({
            pageNumber,
            user: {
                role: userRole,
                id: userId
            }
        }, Joi.object({
            pageNumber: validationSchemas.baseSchemas.unsignedNumberSchema,
            user: validationSchemas.userData.userIdAndRoleSchema(false)
        }))

        if (userRole === 'admin') {
            return await this.Post.findAll({
                offset: pageNumber * this.pageSize, limit: this.pageSize,
            })
        } else {
            return await this.Post.findAll({
                where: {
                    [Op.or]: [{author_id: userId || -1}, {status: 'active'}],
                }, offset: pageNumber * this.pageSize, limit: this.pageSize
            })
        }
    }

    async getPost(id, userRole, userId,
                  includes = {includeComments: false, includeCategories: false}) {

        this.#validate({
            id,
            user: {
                id: userId,
                role: userRole
            }
        }, Joi.object({
            id: validationSchemas.baseSchemas.idSchema.required(),
            user: validationSchemas.userData.userIdAndRoleSchema(false)
        }))

        const where = {
            id: id,
        }

        if (userRole !== 'admin') {
            where[Op.or] = [{author_id: userId || -1}, {status: 'active'}]
        }

        const include = [];

        if (includes.includeComments) {
            include.push('comments');
        }

        if (includes.includeCategories) {
            include.push('categories');
        }

        let post = await this.Post.findOne({
            where, include
        });

        if (!post) {
            throw new PostNotFound(id);
        }
        return post;
    }

    async getComments(id, userRole, userId) {

        this.#validate({
            id,
            user: {
                role: userRole,
                id: userId
            }
        }, Joi.object({
            id: validationSchemas.baseSchemas.idSchema.required(),
            user: validationSchemas.userData.userIdAndRoleSchema(false)
        }))
        const post = await this.getPost(id, userRole, userId, {includeComments: true});

        return post.comments;
    }

    async addComment(id, authorId, content) {

        this.#validate({
            postId: id,
            comment: {
                authorId,
                content
            }
        }, Joi.object({
            postId: validationSchemas.baseSchemas.idSchema.required(),
            comment: validationSchemas.commentData.createCommentSchema
        }))

        const post = await this.getPost(id, 'user', authorId);
        await post.addComment(await this.Comment.create({
            author_id: authorId, content: content
        }));

    }

    async getCategories(id, userRole, userId) {
        this.#validate({
            id,
            user: {
                role: userRole,
                id: userId
            }
        }, Joi.object({
            id: validationSchemas.baseSchemas.idSchema,
            user: validationSchemas.userData.userIdAndRoleSchema(true)
        }))

        const post = await this.getPost(id, userRole, userId, {includeCategories: true});

        return post.categories;
    }

    async getLikes(id, userRole, userId) {

        this.#validate(id, idSchema.required());
        this.#validate(userRole, userRoleSchema);
        this.#validate(userId, idSchema);


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
        title, content, categoryIds
    }) {

        this.#validate({
            userId,
            post: {
                title,
                content,
                categoryIds
            }
        }, Joi.object({
            userId: validationSchemas.baseSchemas.idSchema.required(),
            post: validationSchemas.postData.createPostSchema
        }))

        const categories = await this.#checkCategories(categoryIds);

        const post = await this.Post.create({
            title, content, author_id: userId,
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
                post_id: id, author_id: userId
            }
        });

        if (like) {
            like.type = likeType;
            await like.save();
        } else {
            await this.Like.create({
                post_id: id, author_id: userId, likeType: likeType
            })
        }

    }

    async updatePost(id, userId, {title, content, categoryIds}) {

        this.#validate(id, idSchema.required());
        this.#validate(userId, idSchema.required());
        this.#validate(title, titleSchema);
        this.#validate(content, contentSchema);
        this.#validate(categoryIds, categoryIdsSchema);

        const post = await this.getPost(id, 'user', userId, {includeCategories: true});

        if (title) post.title = title;
        if (content) post.content = content;
        if (categoryIds) {
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
                post_id: postId, author_id: userId
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

module.exports = PostsService;