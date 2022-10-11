const {Router} = require('express');

class CommentsAPI {

    /**
     *
     * @param {import('../../lib/services').CommentsService} commentsService
     * @param user
     * @param checkAuthValidity
     * @param admin
     */
    constructor(commentsService, {user, checkAuthValidity, admin}) {

        this.commentsService = commentsService;
        this.router = Router();

        this.router.get('/:id',
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {

                try {

                    const userRole = req.user && (req.user.isAdmin ? 'admin' : 'user');

                    res.json({
                        comment: await this.commentsService.getComment(req.params.id, userRole, req.user?.id)
                    })

                } catch (err) {
                    next(err);
                }

            })

        this.router.get('/:id/like',
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {

                try {
                    const userRole = req.user && (req.user.isAdmin ? 'admin' : 'user');

                    const likes = await this.commentsService.getLikes(req.params.id, userRole, req.user?.id);

                    res.json({
                        likes
                    })

                } catch (err) {
                    next(err);
                }

            })

        this.router.post('/:id/like',
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {

                try {

                    const userRole = req.user && (req.user.isAdmin ? 'admin' : 'user');

                    await this.commentsService.addLike(req.params.id, req.body.likeType, userRole, req.user?.id);

                    res.json({
                        message: 'Like added'
                    })

                } catch (err) {
                    next(err);
                }

            });

        this.router.patch('/:id',
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                try {

                    await this.commentsService.updateComment(req.params.id, req.user?.id, {content: req.body.content});

                    res.json({
                        message: 'Comment updated'
                    })

                } catch (err) {
                    next(err);
                }
            })

        this.router.delete('/:id',
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                try {

                    await this.commentsService.deleteComment(req.params.id, req.user?.id);

                    res.json({
                        message: 'Comment deleted'
                    })

                } catch (err) {
                    next(err);
                }
            })

        this.router.delete('/:id/like',
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {

                try {

                    await this.commentsService.deleteLike(req.params.id, req.user?.id);

                    res.json({
                        message: 'Like deleted'
                    })

                } catch (err) {
                    next(err);
                }

            })
    }

}
