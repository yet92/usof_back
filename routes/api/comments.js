const { Router } = require("express");

class CommentsAPI {
    /**
     *
     * @param {import('../../lib/services').CommentsService} commentsService
     * @param user
     * @param checkAuthValidity
     * @param admin
     */
    constructor(commentsService, { user, checkAuthValidity, admin }) {
        this.commentsService = commentsService;
        this.router = Router();

        this.router.get(
            "/:id",
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                try {
                    const userRole =
                        req.user && (req.user.isAdmin ? "admin" : "user");

                    res.json({
                        comment: await this.commentsService.getComment(
                            req.params.id,
                            userRole,
                            req.user?.id
                        ),
                    });
                } catch (err) {
                    next(err);
                }
            }
        );

        this.router.get(
            "/:id/like",
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                try {
                    const userRole =
                        req.user && (req.user.isAdmin ? "admin" : "user");

                    const likes = await this.commentsService.getLikes(
                        req.params.id,
                        userRole,
                        req.user?.id
                    );

                    res.json({
                        likes,
                    });
                } catch (err) {
                    next(err);
                }
            }
        );

        this.router.get(
            "/:id/comments",
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                try {
                    const userRole =
                        req.user && (req.user.isAdmin ? "admin" : "user");

                    const comments = await this.commentsService.getComments(
                        req.params.id,
                        userRole,
                        req.user?.id
                    );

                    res.json({
                        comments,
                    });
                } catch (err) {
                    next(err);
                }
            }
        );

        this.router.post(
            "/:id/like",
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                try {
                    const userRole =
                        req.user && (req.user.isAdmin ? "admin" : "user");

                    const likeId = await this.commentsService.addLike(
                        req.params.id,
                        req.body.likeType,
                        userRole,
                        req.user?.id
                    );

                    res.status(201).json({
                        message: "Like added",
                        id: likeId,
                    });
                } catch (err) {
                    next(err);
                }
            }
        );

        this.router.patch(
            "/:id",
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                try {
                    await this.commentsService.updateComment(
                        req.params.id,
                        req.user?.id,
                        { content: req.body.content }
                    );

                    res.json({
                        message: "Comment updated",
                    });
                } catch (err) {
                    next(err);
                }
            }
        );

        this.router.delete(
            "/:id",
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                try {
                    await this.commentsService.deleteComment(
                        req.params.id,
                        req.user?.id
                    );

                    res.json({
                        message: "Comment deleted",
                    });
                } catch (err) {
                    next(err);
                }
            }
        );

        this.router.delete(
            "/:id/like",
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                try {
                    await this.commentsService.deleteLike(
                        req.params.id,
                        req.user?.id
                    );

                    res.json({
                        message: "Like deleted",
                    });
                } catch (err) {
                    next(err);
                }
            }
        );

        this.router.post(
            "/:id/comments",
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                try {
                    const newCommentId = await this.commentsService.addComment(
                        req.params.id,
                        req.user?.id,
                        {
                            content: req.body.content,
                        }
                    );

                    res.status(201).json({
                        message: "Comment created",
                        id: newCommentId,
                    });
                } catch (err) {
                    next(err);
                }
            }
        );

        this.router.get(
            "/:id/toggleVisibility",
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                const id = req.params.id;
                const userRole = req.user?.isAdmin ? "admin" : "user";

                try {
                    const newStatus =
                        await this.commentsService.toggleCommentVisibility(
                            id,
                            userRole,
                            req.user?.id
                        );

                    res.json({
                        message: `Comment with id: ${id} now is ${newStatus}`,
                    });
                } catch (err) {
                    next(err);
                }
            }
        );
    }
}

module.exports = CommentsAPI;
