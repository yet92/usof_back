const MustBeUnique = require('./MustBeUnique');

class CategoryTitleMustBeUnique extends MustBeUnique {
    constructor() {
        super('title', 'category');
    }

}

module.exports = CategoryTitleMustBeUnique;