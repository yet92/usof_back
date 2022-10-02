
const NotFoundRecordInDatabase = require('./NotFoundRecordInDatabase');

class NotFoundComment extends NotFoundRecordInDatabase {

    constructor(id) {
        super('Comments', 'id', id);
    }
}

module.exports = NotFoundComment;