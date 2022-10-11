
const RecordNotFound = require('./RecordNotFound');
const CommentNotFound = require('./CommentNotFound');
const PostNotFound = require('./PostNotFound');
const CategoryNotFound = require('./CategoryNotFound');
const NeedAuthorization = require('./NeedAuthorization');
const NotEnoughRights = require('./NotEnoughRights');
const LikeNotFound = require('./LikeNotFound');
const CategoryTitleMustBeUnique = require('./CategoryTitleMustBeUnique');
const MustBeUnique = require('./MustBeUnique');

module.exports = {
    RecordNotFound,
    CommentNotFound,
    PostNotFound,
    CategoryNotFound,
    NeedAuthorization,
    NotEnoughRights,
    LikeNotFound,
    CategoryTitleMustBeUnique,
    MustBeUnique
}