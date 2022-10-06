const Joi = require("joi");
const {idSchema} = require("./baseSchemas");

const userRoleSchema = Joi.string().valid('user', 'admin');

const userIdAndRoleSchema = (required = true) => {
    if (required) {
        return Joi.object({
            id: idSchema.required(),
            role:   userRoleSchema.required()
        });
    } else {
        return Joi.object({
            id: idSchema,
            role:   userRoleSchema
        })
    }
}

module.exports = {
    userRoleSchema,
    userIdAndRoleSchema,
}