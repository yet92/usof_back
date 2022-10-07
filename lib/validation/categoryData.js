const Joi = require("joi");
const {idSchema, stringSchema} = require("./baseSchemas");

const categoryIdsSchema = Joi.array().items(idSchema);

const createCategorySchema = Joi.object({
    title: stringSchema.min(1).max(128).required(),
    description: stringSchema

});

const  updateCategorySchema = Joi.object({
    id: idSchema.required(),
    title: stringSchema.max(128),
    description: stringSchema
})



module.exports = {
    categoryIdsSchema,
    createCategorySchema,
    updateCategorySchema
}