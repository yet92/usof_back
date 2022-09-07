const {ValidationError} = require("express-validation");

function parseError(err) {

    if (err instanceof ValidationError) {
        return {
            name: err.name,
            message: err.details.body[0].message
        }
    }

}

module.exports = parseError;
