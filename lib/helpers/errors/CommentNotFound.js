
const RecordNotFound = require('./RecordNotFound');

class CommentNotFound extends RecordNotFound {

    constructor(id) {
        super('Comments', 'id', id);
    }
}

module.exports = CommentNotFound;