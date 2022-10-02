
const RecordNotFound = require('./RecordNotFound');

class PostNotFound extends RecordNotFound {

    constructor(id) {
        super('Posts', 'id', id);
    }
}

module.exports = PostNotFound;