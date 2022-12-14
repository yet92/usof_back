const validationSchemas = require("../validation");
const { ValidationError } = require("express-validation");
const { user } = require("../middlewares");
const Joi = require("joi");
const {
    CommentNotFound,
    LikeNotFound,
    NotEnoughRights,
} = require("../helpers/errors");
const { valid } = require("joi");
const { logAsJSON } = require("../debug");
const { Op } = require("sequelize");

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
                error: result.error,
                statusCode: 400,
            });
        }
    }

    /**
     *
     * @param {import('sequelize').Model} comment
     * @param {string} userRole
     * @param {Number} userId
     */
    #checkCommentVisibility(comment, { userRole, userId }) {
        if (comment.status === "active") return true;
        // if (comment.posts && comment.posts[0]?.status === "active") return true;
        if (comment.posts && comment.posts[0]?.author_id === Number(userId))
            return true;
        return userRole === "admin" || comment.author?.id === Number(userId);
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
        this.#validate(
            {
                id,
                user: {
                    role: userRole,
                    id: userId,
                },
            },
            Joi.object({
                id: validationSchemas.baseSchemas.idSchema,
                user: validationSchemas.userData.userIdAndRoleSchema(true),
            })
        );

        const comment = await this.Comment.findByPk(id, {
            include: [
                {
                    association: "author",
                    attributes: [
                        "id",
                        "login",
                        "fullName",
                        "rating",
                        "profilePicture",
                    ],
                },
                {
                    association: "posts",
                    attributes: ["id", "status", "author_id"],
                },
            ],
        });

        if (!comment) {
            throw new CommentNotFound(id);
        }

        if (!this.#checkCommentVisibility(comment, { userRole, userId })) {
            throw new CommentNotFound(id);
        }

        return comment;
    }

    async getLikes(id, userRole, userId) {
        const comment = await this.getComment(id, userRole, userId);

        return await this.Like.findAll({
            where: {
                comment_id: comment.id,
            },
        });
    }

    async addLike(id, likeType, userRole, userId) {
        this.#validate(
            {
                likeType,
            },
            Joi.object({
                likeType: validationSchemas.likeData.likeTypeSchema.required(),
            })
        );

        await this.getComment(id, userRole, userId);

        let like = await this.Like.findOne({
            where: {
                comment_id: id,
                author_id: userId,
            },
        });

        if (like) {
            await like.updateUserRating(like.type === "like" ? -1 : 1);
            like.type = likeType;
            await like.save();
        } else {
            like = await this.Like.create({
                comment_id: id,
                author_id: userId,
                type: likeType,
            });
        }
        await like.updateUserRating(like.type === "like" ? 1 : -1);

        return like.id;
    }

    async updateComment(id, userId, { content }) {
        this.#validate(
            {
                content,
            },
            Joi.object({
                content: validationSchemas.baseSchemas.stringSchema,
            })
        );

        const comment = await this.getComment(id, "user", userId);

        if (comment.author_id !== userId) {
            throw new NotEnoughRights();
        }

        content && (comment.content = content);

        await comment.save();
    }

    async deleteComment(id, userId) {
        const comment = await this.getComment(id, "user", userId);

        if (comment.author_id === userId) {
            await comment.destroy();
        } else {
            throw new NotEnoughRights();
        }
    }

    async deleteLike(id, userId) {
        const like = await this.Like.findOne({
            where: {
                comment_id: id,
                author_id: userId,
            },
        });

        if (!like) {
            throw new LikeNotFound(userId);
        }

        await like.destroy();
    }

    async addComment(id, userId, { content }) {
        this.#validate(
            {
                comment: {
                    authorId: userId,
                    content,
                },
            },
            Joi.object({
                comment: validationSchemas.commentData.createCommentSchema,
            })
        );

        const comment = await this.getComment(id, "user", userId);

        const newComment = await this.Comment.create({
            author_id: userId,
            content,
        });

        await comment.addSelfComments(newComment);

        return newComment.id;
    }

    async getComments(id, userRole, userId) {
        const comment = await this.getComment(id, userRole, userId);

        const where = {};

        if (userRole !== "admin") {
            where[Op.or] = [{ status: "active" }, { author_id: userId }];
        }

        const comments = await comment.getSelfComments();

        return comments;
    }

    async toggleCommentVisibility(id, userRole, userId) {
        this.#validate(
            {
                id,
                user: {
                    role: userRole,
                    id: userId,
                },
            },
            Joi.object({
                id: validationSchemas.baseSchemas.idSchema,
                user: validationSchemas.userData.userIdAndRoleSchema(true),
            })
        );

        const comment = await this.getComment(id, userRole, userId);

        if (comment.author_id !== userId && userRole !== "admin") {
            throw new NotEnoughRights();
        }

        await comment.toggleStatus();

        return comment.status;
    }
}

module.exports = CommentsService;
