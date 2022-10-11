class MustBeUnique extends Error {
    constructor(field, model) {
        super(`${field} of ${model} must be unique`);
        this.statusCode = 400;
    }
}

module.exports = MustBeUnique;