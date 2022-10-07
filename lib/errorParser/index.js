const {ValidationError} = require("express-validation");
// TODO: create something type for ValidationError
function parseError(err) {

    if (err instanceof ValidationError) {

        const message = ((err) => {
            if (err.details && err.details.body) {
                return err.details.body[0]
            }
            if (err.error.details && err.error.details[0].message) {
                /**
                 * @type {String}
                 */
                const message = err.error.details[0].message;

                if (/user\.*/.test(message)) {
                    err.statusCode = 401;
                    err.name = 'Authorization Error';
                    return 'Authorization Required';
                }

                return err.error.details[0].message;
            }
        })(err);

        return {
            name: err.name,
            message
        }
    }

}

module.exports = parseError;
