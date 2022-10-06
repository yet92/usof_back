const Joi = require("joi");
const likeTypeSchema = Joi.string().valid('like', 'dislike');

module.exports = {
    likeTypeSchema
}