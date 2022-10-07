
const RecordNotFound = require('./RecordNotFound');

class LikeNotFound extends RecordNotFound {

    constructor(author_id) {
        super('Likes', 'author_id', author_id);
    }
}

module.exports = LikeNotFound;