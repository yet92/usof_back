
class NeedAuthorization extends Error {

    constructor() {
        super('You must be authorized to use this endpoint');
    }

}

module.exports = NeedAuthorization;