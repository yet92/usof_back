const {Op} = require("sequelize");
const {user} = require("../middlewares");
const {NotFoundPost} = require("../helpers/errors");

class PostsService {

    /**
     *
     * @param {typeof import('sequelize').Model} Post
     * @param {typeof import('sequelize').Model} Comment
     * @param pageSize
     */
    constructor({Post, Comment, pageSize = 10}) {
        this.Post = Post;
        this.Comment = Comment;
        this.pageSize = pageSize;
    }

    async getAll(pageNumber, userRole, userId) {
        if (userRole === 'admin') {
            return await this.Post.findAll({
                offset: pageNumber * this.pageSize,
                limit: this.pageSize,
            })
        } else {
            return await this.Post.findAll({
                where: {
                    [Op.or]: [
                        {author_id: userId},
                        {status: 'active'}
                    ]
                },
                offset: pageNumber * this.pageSize,
                limit: this.pageSize
            })
        }
    }

    async getPost(id, userRole, userId, includeComments = false) {

        if (userRole === 'admin') {
            return await this.Post.findByPk(id);
        }

        const where = {
            id: id,
            [Op.or]: [{
                status: 'active',
                author_id: userId
            }]
        }

        if (includeComments) {
            where.include = 'comments';
        }

        return await this.Post.findOne({
            where
        })

    }

    async getComments(id, userRole, userId) {
        const post = await this.getPost(id, userRole, userId, true);
        return post && post.comments;
    }

    async creteComment(id, authorId, content) {
        const post = await this.getPost(id, 'user', authorId);

        if (!post) {
            throw new NotFoundPost(id);
        }

        await post.addComment(
            await this.Comment.create({
                authorId: authorId,
                content: content
            })
        );

    }



}