
const RecordNotFound = require('./RecordNotFound');

class CategoryNotFound extends RecordNotFound {

    constructor(id) {
        super('Categories', 'id', id);
    }
}

module.exports = CategoryNotFound;