class MustBeUnique extends Error {
    constructor(field, model) {
        super(`${field} of ${model} must be unique`);
    }
}

module.exports = MustBeUnique;