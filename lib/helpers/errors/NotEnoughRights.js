
module.exports = class NotEnoughRights extends Error {

    constructor() {
        super("Not Enough Rights For This Operation");
        this.statusCode = 403;
    }

}