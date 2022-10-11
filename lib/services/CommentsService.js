const validationSchemas = require('../validation');
const {ValidationError} = require("express-validation");
const {user} = require("../middlewares");
const Joi = require("joi");
const {CommentNotFound, LikeNotFound, NotEnoughRights} = require("../helpers/errors");
const {valid} = require("joi");
const {logAsJSON} = require("../debug");

class CommentsService {

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

    /**
     *
     * @param {import('sequelize').Model} comment
     * @param {string} userRole
     * @param {Number} userId
     */
    #checkCommentVisibility(comment, {userRole, userId}) {

        if (comment.posts && comment.posts[0]?.status === 'active') return true;
        if (comment.posts && comment.posts[0]?.author_id === Number(userId)) return true;
        return userRole === 'admin' ||
            comment.author?.id === Number(userId)
    }

    /**
     *
     * @param {typeof import('sequelize').Model} Comment
     * @param {typeof import('sequelize').Model} Like
     */

    constructor(Comment, Like) {
        this.Comment = Comment;
        this.Like = Like;
    }

    async getComment(id, userRole, userId) {

        this.#validate({
            id,
            user: {
                role: userRole,
                id: userId
            }
        }, Joi.object({
            id: validationSchemas.baseSchemas.idSchema,
            user: validationSchemas.userData.userIdAndRoleSchema(true)
        }));

        const comment = await this.Comment.findByPk(id, {
            include: [
                {
                    association: 'author',
                    attributes: ['id', 'login', 'fullName', 'rating', 'profilePicture']
                },
                {
                    association: 'posts',
                    attributes: ['id', 'status', 'author_id']
                }
            ]
        });

        if (!comment) {
            throw new CommentNotFound(id);
        }

        if (!this.#checkCommentVisibility(comment, {userRole, userId})) {
            throw new CommentNotFound(id);
        }

        return comment;

    }

    async getLikes(id, userRole, userId) {

        const comment = await this.getComment(id, userRole, userId);

        return await this.Like.findAll({
            where: {
                comment_id: comment.id
            }
        });
    }

    async addLike(id, likeType, userRole, userId) {
        this.#validate({
            likeType
        }, Joi.object({
            likeType: validationSchemas.likeData.likeTypeSchema.required()
        }))

        await  this.getComment(id, userRole, userId);


        let like = await this.Like.findOne({
            where: {
                comment_id: id, author_id: userId
            }
        });

        if (like) {
            await like.updateUserRating(like.type === 'like' ? -1 : 1);
            like.type = likeType;
            await like.save();
        } else {
            like = await this.Like.create({
                comment_id: id, author_id: userId, type: likeType
            })
        }
        await like.updateUserRating(like.type === 'like' ? 1 : -1);
    }

    async updateComment(id, userId, {content}) {

        this.#validate({
            content
        }, Joi.object({
            content: validationSchemas.baseSchemas.stringSchema
        }));

        const comment = await this.getComment(id, 'user', userId);

        if (comment.author_id !== userId) {
            throw new NotEnoughRights();
        }

        content && (comment.content = content);

        await comment.save();
    }

    async deleteComment(id, userId) {

        const comment = await this.getComment(id, 'user', userId);

        if (comment.author_id === userId) {
            await comment.destroy();
        } else {
            throw new NotEnoughRights();
        }

    }

    async deleteLike(id, userId) {

        const like = await this.Like.findOne({
            where: {
                comment_id: id, author_id: userId
            }
        });

        if (!like) {
            throw new LikeNotFound(userId);
        }

        await like.destroy();

    }



}

module.exports = CommentsService;
