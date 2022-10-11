const {ValidationError} = require("express-validation");
const validationSchemas = require('../validation');
const Joi = require("joi");
const {Op} = require("sequelize");
const {CategoryTitleMustBeUnique, NotEnoughRights, CategoryNotFound} = require("../helpers/errors");
const {createCategorySchema} = require("../validation/categoryData");
const {callbackPromise} = require("nodemailer/lib/shared");

class CategoriesService {

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

    constructor({Category}) {
        this.Category = Category;
    }

    async getAll(userId) {

        this.#validate({
            user: {
                id: userId
            }
        }, Joi.object({
            user: {
                id: validationSchemas.baseSchemas.idSchema.required()
            }
        }));

        return await this.Category.findAll();
    }

    async get(id, userId) {
        this.#validate({
            id,
            user: {
                id: userId
            }
        }, Joi.object({
            id: validationSchemas.baseSchemas.idSchema.required(),
            user: {
                id: validationSchemas.baseSchemas.idSchema.required()
            }
        }));

        return await this.Category.findByPk(id);
    }

    async getPostsOf(id, userRole, userId) {
        this.#validate({
            id,
            user: {
                id: userId,
                role: userRole
            }
        }, Joi.object({
            id: validationSchemas.baseSchemas.idSchema.required(),
            user: validationSchemas.userData.userIdAndRoleSchema(true)
        }));

        const where = {};
        if (userRole !== 'admin') {
            where[Op.or] = [
                {author_id: userId},
                {status: 'active'}
            ]
        }

        const category = await this.Category.findByPk(id, {
            include: {
                association: 'posts',
                where
            }
        })

        if (!category) {
            throw new CategoryNotFound(id);
        }

        return category.posts;
    }

    async createCategory(userRole, userId, {title, description}) {
        this.#validate({
            user: {
                id: userId,
                role: userRole
            },
            category: {
                title,
                description
            }
        }, Joi.object({
            user: validationSchemas.userData.userIdAndRoleSchema(true),
            category: createCategorySchema
        }));

        if (userRole !== 'admin') {
            throw new NotEnoughRights();
        }

        if (await this.Category.findOne({
            where: {
                title
            }
        })) {
            throw new CategoryTitleMustBeUnique();
        }

        await this.Category.create({
            title
        });

    }

    async updateCategory(id, userRole, userId, {title, description}) {
        this.#validate({
            user: {
                id: userId,
                role: userRole
            },
            category: {
                id,
                title,
                description
            }
        }, Joi.object({
            user: validationSchemas.userData.userIdAndRoleSchema(true),
            category: validationSchemas.categoryData.updateCategorySchema
        }));

        if (userRole !== 'admin') {
            throw new NotEnoughRights();
        }

        const category = await this.Category.findByPk(id);

        if (!category) {
            throw new CategoryNotFound(id);
        }



        if (title) {
            const uniqueCheck = await this.Category.findOne({
                where: {
                    title
                }
            })

            if (uniqueCheck) {
                throw new CategoryTitleMustBeUnique();
            }

            category.title = title;
        }

        description && (category.description = description);

        await category.save();

    }

    async deleteCategory(id, userRole, userId) {
        this.#validate({
            id,
            user: {
                id: userId,
                role: userRole
            }
        }, Joi.object({
            id: validationSchemas.baseSchemas.idSchema.required(),
            user: validationSchemas.userData.userIdAndRoleSchema(true)
        }));

        const category = await this.Category.findByPk(id);

        if (!category) {
            throw new CategoryNotFound(id);
        }

        await category.destroy();
    }

}

module.exports = CategoriesService;