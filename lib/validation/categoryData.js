const Joi = require("joi");
const {idSchema} = require("./baseSchemas");

const categoryIdsSchema = Joi.array().items(idSchema);

module.exports = {
    categoryIdsSchema
}