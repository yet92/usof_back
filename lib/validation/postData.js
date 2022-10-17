const Joi = require("joi");
const { stringSchema, idSchema } = require("./baseSchemas");
const { categoryIdsSchema } = require("./categoryData");

const titleSchema = Joi.string().max(128);

const createPostSchema = Joi.object({
    title: titleSchema.required(),
    content: stringSchema.required(),
    categoryIds: categoryIdsSchema.required(),
});

const editPostSchema = Joi.object({
    id: idSchema.required(),
    title: titleSchema,
    content: stringSchema,
    categoryIds: categoryIdsSchema,
});

const sortTypes = Joi.string().valid("likes", "date");

const statusSchema = Joi.string().valid("active", "inactive");

module.exports = {
    createPostSchema,
    editPostSchema,
    sortTypes,
    statusSchema,
};
