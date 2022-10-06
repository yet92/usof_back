
const Joi = require('joi')
const {idSchema, stringSchema} = require("./baseSchemas");

const createCommentSchema = Joi.object({

    authorId: idSchema.required(),
    content: stringSchema.min(1)

})

module.exports = {
    createCommentSchema
}