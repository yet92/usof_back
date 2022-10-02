
class NotFoundRecordInDatabase extends Error {

    constructor(tableName, foreignKeyColumnName, foreignKeyValue) {
        super(`Not Found Record In Table ${tableName} with ${foreignKeyColumnName}: ${foreignKeyValue}`);
    }

}

module.exports = NotFoundRecordInDatabase;