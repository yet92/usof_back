const Joi = require("joi");
const {stringSchema, idSchema} = require("./baseSchemas");
const {categoryIdsSchema} = require("./categoryData");

const titleSchema = Joi.string().max(128);

const createPostSchema = Joi.object({
    title: titleSchema.required(),
    content: stringSchema.required(),
    categoryIds: categoryIdsSchema.required()
});

const editPostSchema = Joi.object({
    id: idSchema.required(),
    titleSchema: titleSchema,
    content: stringSchema,
    categoryIds: categoryIdsSchema
})

module.exports ={
    createPostSchema,
    editPostSchema
}