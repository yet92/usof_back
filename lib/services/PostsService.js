const sequelize = require("sequelize");
const { Op, QueryTypes } = require("sequelize");
const { user } = require("../middlewares");
const {
    PostNotFound,
    CategoryNotFound,
    NotEnoughRights,
    LikeNotFound,
} = require("../helpers/errors");
const Joi = require("joi");
const { ValidationError } = require("express-validation");

const validationSchemas = require("../validation");
const { userRoleSchema } = require("../validation/userData");
const { logAsJSON } = require("../debug");
const { logger } = require("sequelize/lib/utils/logger");
const { valid } = require("joi");
const { callbackPromise } = require("nodemailer/lib/shared");
const { init } = require("../../repositories");

// TODO: add post status change action for admins and for users
// TODO: change id to postId where addLike, addPost, etc.

class PostsService {
    /**
     *
     * @param {typeof import('sequelize').Model} Post
     * @param {typeof import('sequelize').Model} Comment
     * @param {typeof import('sequelize').Model} Like
     * @param {typeof import('sequelize').Model} Category
     * @param {import ('sequelize')} sequelize
     * @param pageSize
     */
    constructor({ Post, Comment, Like, Category, sequelize, pageSize = 10 }) {
        this.Post = Post;
        this.Comment = Comment;
        this.Like = Like;
        this.Category = Category;
        this.sequelize = sequelize;
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
                statusCode: 400,
            });
        }
    }

    async getAll(pageNumber, sortBy, userRole, userId) {
        if (!pageNumber) pageNumber = 0;

        this.#validate(
            {
                pageNumber,
                user: {
                    role: userRole,
                    id: userId,
                },
                sortBy,
            },
            Joi.object({
                pageNumber: validationSchemas.baseSchemas.unsignedNumberSchema,
                user: validationSchemas.userData.userIdAndRoleSchema(false),
                sortBy: validationSchemas.postData.sortTypes,
            })
        );

        let literals = [];
        let include;
        let order;
        if (sortBy === "likes") {
            literals.push({
                literal: `(
                            SELECT COUNT(*) 
                            FROM Likes
                            WHERE 
                                Likes.post_id = \`Post\`.id  
                                AND
                                Likes.type = "like"
                            )`,
                as: "likesCount",
            });

            // literals.push(
            //     {
            //         literal: `(
            //                 SELECT COUNT(*)
            //                 FROM Likes
            //                 WHERE
            //                     Likes.post_id = \`Post\`.id
            //                     AND
            //                     Likes.type = "dislike"
            //                 )`,
            //         as: 'dislikesCount'
            //     }
            // )
            //
            // literals.push(
            //     {
            //         literal: `(
            //                SELECT (likesCount - dislikesCount)
            //         )`,
            //         as: 'rating'
            //     }
            // )

            include = [
                [sequelize.literal(literals[0].literal), literals[0].as],
                // [
                //     sequelize.literal(literals[1].literal),
                //     literals[1].as
                // ],
                // [
                //     sequelize.literal(literals[2].literal),
                //     literals[2].as
                // ],
            ];

            order = [[sequelize.literal("likesCount"), "DESC"]];
        } else if (sortBy === "date") {
            order = [["createdAt", "DESC"]];
        }

        if (userRole === "admin") {
            return await this.Post.findAndCountAll({
                attributes: {
                    include,
                },
                include: "categories",
                order,
                offset: pageNumber * this.pageSize,
                limit: this.pageSize,
            });
        } else {
            return await this.Post.findAndCountAll({
                where: {
                    [Op.or]: [
                        { author_id: userId || -1 },
                        { status: "active" },
                    ],
                },
                attributes: {
                    include,
                },
                include: "categories",
                order,
                offset: pageNumber * this.pageSize,
                limit: this.pageSize,
            });
        }
    }

    async getPost(
        id,
        userRole,
        userId,
        includes = { includeComments: false, includeCategories: false }
    ) {
        this.#validate(
            {
                id,
                user: {
                    id: userId,
                    role: userRole,
                },
            },
            Joi.object({
                id: validationSchemas.baseSchemas.idSchema.required(),
                user: validationSchemas.userData.userIdAndRoleSchema(false),
            })
        );

        const where = {
            id: id,
        };

        if (userRole !== "admin") {
            where[Op.or] = [{ author_id: userId || -1 }, { status: "active" }];
        }

        const include = [];

        if (includes.includeComments) {
            include.push("comments");
        }

        if (includes.includeCategories) {
            include.push("categories");
        }

        let post = await this.Post.findOne({
            where,
            include,
        });

        if (!post) {
            throw new PostNotFound(id);
        }
        return post;
    }

    async getComments(id, userRole, userId) {
        this.#validate(
            {
                id,
                user: {
                    role: userRole,
                    id: userId,
                },
            },
            Joi.object({
                id: validationSchemas.baseSchemas.idSchema.required(),
                user: validationSchemas.userData.userIdAndRoleSchema(false),
            })
        );
        const post = await this.getPost(id, userRole, userId, {
            includeComments: true,
        });

        return post.comments;
    }

    async addComment(id, authorId, content) {
        this.#validate(
            {
                postId: id,
                comment: {
                    authorId,
                    content,
                },
            },
            Joi.object({
                postId: validationSchemas.baseSchemas.idSchema.required(),
                comment: validationSchemas.commentData.createCommentSchema,
            })
        );

        const post = await this.getPost(id, "user", authorId);
        const newComment = await this.Comment.create({
            author_id: authorId,
            content: content,
        });
        await post.addComment(newComment);
        return newComment.id;
    }

    async getCategories(id, userRole, userId) {
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

        const post = await this.getPost(id, userRole, userId, {
            includeCategories: true,
        });

        return post.categories;
    }

    async getLikes(id, userRole, userId) {
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

        const post = await this.getPost(id, userRole, userId);

        return await this.Like.findAll({
            where: {
                post_id: post.id,
            },
            include: {
                association: "author",
                attributes: ["login", "fullName", "rating", "profilePicture"],
            },
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

    async createPost(userId, { title, content, categoryIds }) {
        this.#validate(
            {
                userId,
                post: {
                    title,
                    content,
                    categoryIds,
                },
            },
            Joi.object({
                userId: validationSchemas.baseSchemas.idSchema.required(),
                post: validationSchemas.postData.createPostSchema,
            })
        );

        const categories = await this.#checkCategories(categoryIds);

        const post = await this.Post.create({
            title,
            content,
            author_id: userId,
        });

        await Promise.all(
            categories.map((category) => {
                return post.addCategory(category);
            })
        );

        await post.save();

        return post.id;
    }

    async addLike(id, userId, likeType) {
        this.#validate(
            {
                id,
                likeType,
                user: {
                    id: userId,
                    role: "user",
                },
            },
            Joi.object({
                id: validationSchemas.baseSchemas.idSchema.required(),
                likeType: validationSchemas.likeData.likeTypeSchema.required(),
                user: validationSchemas.userData.userIdAndRoleSchema(true),
            })
        );

        await this.getPost(id, "user", userId);

        let like = await this.Like.findOne({
            where: {
                post_id: id,
                author_id: userId,
            },
        });

        if (like) {
            await like.updateUserRating(like.type === "like" ? -1 : 1);
            like.type = likeType;
            await like.save();
        } else {
            like = await this.Like.create({
                post_id: id,
                author_id: userId,
                type: likeType,
            });
        }
        await like.updateUserRating(like.type === "like" ? 1 : -1);

        return like.id;
    }

    async updatePost(id, userId, { title, content, categoryIds }) {
        this.#validate(
            {
                user: {
                    id: userId,
                    role: "user",
                },
                post: {
                    id,
                    title,
                    content,
                    categoryIds,
                },
            },
            Joi.object({
                user: validationSchemas.userData.userIdAndRoleSchema(true),
                post: validationSchemas.postData.editPostSchema,
            })
        );

        const post = await this.getPost(id, "user", userId, {
            includeCategories: true,
        });

        if (post.author_id !== userId) {
            throw new NotEnoughRights();
        }

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
        this.#validate(
            {
                id,
                user: {
                    id: userId,
                    role: "user",
                },
            },
            Joi.object({
                id: validationSchemas.baseSchemas.idSchema.required(),
                user: validationSchemas.userData.userIdAndRoleSchema(true),
            })
        );
        const post = await this.getPost(id, "user", userId);

        if (post.author_id !== userId) {
            throw new NotEnoughRights();
        }

        await post.destroy();
    }

    async deleteLike(postId, userId) {
        this.#validate(
            {
                postId,
                user: {
                    id: userId,
                    role: "user",
                },
            },
            Joi.object({
                postId: validationSchemas.baseSchemas.idSchema.required(),
                user: validationSchemas.userData.userIdAndRoleSchema(true),
            })
        );

        const like = await this.Like.findOne({
            where: {
                post_id: postId,
                author_id: userId,
            },
        });

        if (!like) {
            throw new LikeNotFound(userId);
        }

        like && (await like.destroy());
    }

    async togglePostVisibility(id, userRole, userId) {
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

        const post = await this.getPost(id, userRole, userId);

        if (post.author_id !== userId && userRole !== "admin") {
            throw new NotEnoughRights();
        }

        if (!post) {
            throw new PostNotFound(id);
        }

        await post.toggleStatus();

        // const newStatus = post.status === 'active' ? 'inactive' : 'active'
        //
        // post.status = newStatus;
        //
        // await post.save();

        return post.status;
    }

    async getAllFiltered(
        pageNumber,
        userRole,
        userId,
        {
            sortBy = "likes",
            filters: {
                categoryIds = null,
                withStatus,
                dateInterval: { from, to } = { from: null, to: null },
            } = {},
        },
        options = {
            defaultWhereExpr: [],
        }
    ) {
        this.#validate(
            {
                pageNumber,
                user: {
                    role: userRole,
                    id: userId,
                },
                sortBy,
                categoryIds,
                withStatus,
                from,
                to,
            },
            Joi.object({
                pageNumber: validationSchemas.baseSchemas.unsignedNumberSchema,
                user: validationSchemas.userData.userIdAndRoleSchema(false),
                sortBy: validationSchemas.postData.sortTypes,
                categoryIds: categoryIds
                    ? validationSchemas.categoryData.categoryIdsSchema
                    : Joi.allow(null),
                withStatus: validationSchemas.postData.statusSchema,
                from: Joi.date().allow(null),
                to: Joi.date().allow(null),
            })
        );

        const selectExpr = ["*"];
        const whereExpr = options.defaultWhereExpr || [];
        const fromExpr = ["Posts"];
        let orderBy = `ORDER BY likes DESC`;

        if (userRole !== "admin") {
            if (userId) {
                if (whereExpr.length) {
                    whereExpr.push(
                        `AND (status='active' OR author_id=${userId})`
                    );
                } else {
                    whereExpr.push(`(status='active' OR author_id=${userId})`);
                }
            } else {
                if (whereExpr.length) {
                    whereExpr.push(`AND status='active'`);
                } else {
                    whereExpr.push(`status='active'`);
                }
            }
        }

        if (categoryIds) {
            const categoryIdsOr = categoryIds
                .map((id) => {
                    return `CategoryId=${id}`;
                })
                .join(" or ");

            fromExpr.push(
                `
            (
                select * from (
                    select *, COUNT(*) as count FROM (
                        select PostId from Post_Categories 
                            as postids where ${categoryIdsOr} 
                        ) as counts
                          group by PostId
                ) as postsWithCategories
                where count=${categoryIds.length}
            ) as pc
            `
            );

            whereExpr.length
                ? whereExpr.push(`AND Posts.id=PostId`)
                : whereExpr.push(`Posts.id=PostId`);
        }

        if (sortBy === "likes") {
            selectExpr.push(
                `(
                SELECT COUNT(*) 
                FROM Likes
                WHERE 
                    Likes.post_id = \`Posts\`.id  
                    AND
                    Likes.type = "like"
            ) as likes`
            );
        } else if (sortBy === "date") {
            orderBy = `ORDER BY createdAt DESC`;
        }

        if (withStatus) {
            if (whereExpr.length) {
                whereExpr.push(`AND status='${withStatus}'`);
            } else {
                whereExpr.push(`status='${withStatus}'`);
            }
        }

        if (from && to) {
            const formattedFrom = `date('${from.getFullYear()}-${
                from.getMonth() + 1
            }-${from.getDate()}')`;
            const formattedTo = `date('${to.getFullYear()}-${
                to.getMonth() + 1
            }-${to.getDate()}')`;
            if (whereExpr.length) {
                whereExpr.push(
                    `AND date(createdAt) between ${formattedFrom} AND ${formattedTo}`
                );
            } else {
                whereExpr.push(
                    `date(createdAt) between ${formattedFrom} AND ${formattedTo}`
                );
            }
        }

        const query = `
        SELECT ${selectExpr.join(", ")} FROM ${fromExpr.join(
            ", "
        )} 
        ${whereExpr.length ? 'WHERE ' + whereExpr.join(" ") : '' } ${orderBy}  
        LIMIT ${this.pageSize} OFFSET ${this.pageSize * pageNumber}
        `;

        const posts = await this.sequelize.query(query, {
            type: QueryTypes.SELECT,
        });

        return posts;
    }

    async getPostsOf(
        pageNumber,
        userId,
        {
            sortBy = "likes",
            filters: {
                categoryIds = null,
                withStatus,
                dateInterval: { from, to } = { from: null, to: null },
            } = {},
        }
    ) {
        this.#validate(
            {
                user: {
                    id: userId,
                    role: "user",
                },
            },
            Joi.object({
                user: validationSchemas.userData.userIdAndRoleSchema(true),
            })
        );

        return this.getAllFiltered(
            pageNumber,
            "user",
            userId,
            {
                sortBy,
                filters: {
                    categoryIds,
                    withStatus,
                    dateInterval: {
                        from,
                        to,
                    },
                },
            },
            {
                defaultWhereExpr: [`author_id=${userId}`],
            }
        );
    }
}

module.exports = PostsService;
