const {Router} = require('express');

class PostsAPI {

    /**
     *
     * @param {import('lib/services/PostsService')} postsService
     * @param user
     * @param checkAuthValidity
     * @param admin
     */
    constructor(postsService, {user, checkAuthValidity, admin}) {
        this.router = Router();
        this.postsService = postsService;

        this.router.get('/',
            user,
            checkAuthValidity,
            admin,
            this.getPosts.bind(this)
        )

        this.router.get('/:id',
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {

                const id = req.params.id;
                const userRole = req.user?.isAdmin ? 'admin' : 'user';

                try {
                    res.json({
                        post: await this.postsService.getPost(
                            id,
                            userRole,
                            req.user?.id,
                        )
                    })
                } catch (err) {
                    next(err);
                }


            });

        this.router.get('/:id/comments',
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                const id = req.params.id;
                const userRole = req.user?.isAdmin ? 'admin' : 'user';

                try {
                    res.json({
                        comments: await this.postsService.getComments(
                            id,
                            userRole,
                            req.user?.id,
                        )
                    })
                } catch (err) {
                    next(err);
                }


            });

        this.router.get('/:id/categories',
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                const id = req.params.id;
                const userRole = req.user?.isAdmin ? 'admin' : 'user';

                try {

                    res.json({
                        categories: await this.postsService.getCategories(
                            id,
                            userRole,
                            req.user?.id || -1,
                        )
                    })
                } catch (err) {
                    next(err);
                }

            });

        this.router.get('/:id/like',
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {

                const id = req.params.id;
                const userRole = req.user?.isAdmin ? 'admin' : 'user';

                try {

                    res.json({
                        likes: await this.postsService.getLikes(
                            id,
                            userRole,
                            req.user?.id || -1,
                        )
                    })
                } catch (err) {
                    next(err);
                }
            }
        );

        this.router.post('/:id/comments',
            user,
            checkAuthValidity,
            async (req, res, next) => {
                const id = req.params.id;
                const content = req.body.content;

                try {
                    await this.postsService.addComment(id, req.user?.id, content)

                    res.status(201).json({
                        message: 'Comment created'
                    })
                } catch (err) {
                    next(err);
                }

            })

        this.router.post('/',
            user,
            checkAuthValidity,
            async (req, res, next) => {

                const {title, content, categoryIds} = req.body;

                try {

                    await this.postsService.createPost(
                        req.user?.id,
                        {title, content, categoryIds}
                    )

                    res.status(201).json({
                        message: 'Post created'
                    })

                } catch (err) {
                    next(err);
                }

            })

        this.router.post('/:id/like',
            user,
            checkAuthValidity,
            async (req, res, next) => {

                const id = req.params.id;
                const likeType = req.body.likeType;

                try {

                    await this.postsService.addLike(
                        id,
                        req.user?.id,
                        likeType
                    )

                    res.status(201).json({
                        message: 'Like added'
                    })

                } catch (err) {
                    next(err);
                }

            });

        this.router.patch('/:id',
            user,
            checkAuthValidity,
            async (req, res, next) => {

                const id = req.params.id;
                const {title, content, categoryIds} = req.body;

                try {

                    await this.postsService.updatePost(
                        id,
                        req.user?.id,
                        {
                            title,
                            content,
                            categoryIds
                        }
                    )

                    res.json({
                        message: 'Post updated'
                    })

                } catch (err) {
                    next(err);
                }

            });

        this.router.delete('/:id',
            user,
            checkAuthValidity,
            async (req, res, next) => {

                const id = req.params.id;

                try {

                    await  this.postsService.deletePost(id, req.user?.id);

                    res.json({
                        message: 'Post deleted'
                    })

                } catch (err) {
                    next(err);
                }
            });

        this.router.delete('/:id/like',
            user,
            checkAuthValidity,
            async (req, res, next) => {

                const id = req.params.id;

                try {

                    await this.postsService.deleteLike(id, req.user?.id);
                    res.json({
                        message: 'Like deleted'
                    })
                } catch (err) {
                    next(err);
                }

            });

        this.router.get('/:id/toggleVisibility',
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {

                const id = req.params.id;
                const userRole = req.user?.isAdmin ? 'admin' : 'user';

                try {

                    const newStatus = await this.postsService.togglePostVisibility(id, userRole, req.user?.id);

                    res.json({
                        message: `Post with id: ${id} now is ${newStatus}`
                    })

                } catch (err) {
                    next(err);
                }

            });

    }

    async getPosts(req, res, next) {
        const page = req.query.page || 0;
        const sort = req.query.sort || 'likes'
        const userRole = req.user?.isAdmin ? 'admin' : 'user';

        try {
            res.json(
                {
                    posts: await this.postsService.getAll(Number(page), sort, userRole, req.user?.id)
                }
            )
        } catch (err) {
            next(err);
        }
    }


}

module.exports = PostsAPI;