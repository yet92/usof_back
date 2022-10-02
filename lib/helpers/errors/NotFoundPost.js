
const NotFoundRecordInDatabase = require('./NotFoundRecordInDatabase');

class NotFoundPost extends NotFoundRecordInDatabase {

    constructor(id) {
        super('Posts', 'id', id);
    }
}

module.exports = NotFoundPost;