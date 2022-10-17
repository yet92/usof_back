const Joi = require("joi");

const stringSchema = Joi.string();
const idSchema = Joi.number().min(1);
const unsignedNumberSchema = Joi.number().min(0);

module.exports = {
    stringSchema,
    idSchema,
    unsignedNumberSchema,
};
