const { Router } = require("express");

class CategoriesAPI {
    /**
     *
     * @param {import('../../lib/services').CategoriesService} categoriesService
     * @param user
     * @param checkAuthValidity
     * @param admin
     */
    constructor(categoriesService, { user, checkAuthValidity, admin }) {
        this.categoriesService = categoriesService;
        this.router = Router();

        this.router.get(
            "/",
            user,
            checkAuthValidity,
            async (req, res, next) => {
                try {
                    res.json({
                        categories: await this.categoriesService.getAll(
                            req.user?.id
                        ),
                    });
                } catch (err) {
                    next(err);
                }
            }
        );

        this.router.get(
            "/:id",
            user,
            checkAuthValidity,
            async (req, res, next) => {
                try {
                    res.json({
                        category: await this.categoriesService.get(
                            req.params.id,
                            req.user?.id
                        ),
                    });
                } catch (err) {
                    next(err);
                }
            }
        );

        this.router.get(
            "/:id/posts",
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                try {
                    res.json({
                        posts: await this.categoriesService.getPostsOf(
                            req.params.id,
                            req.user?.isAdmin ? "admin" : "user",
                            req.user?.id
                        ),
                    });
                } catch (err) {
                    next(err);
                }
            }
        );

        this.router.post(
            "/",
            user,
            checkAuthValidity,
            admin,
            async (req, res, next) => {
                try {
                    const categoryId =
                        await this.categoriesService.createCategory(
                            req.user?.isAdmin ? "admin" : "user",
                            req.user?.id,
                            {
                                title: req.body.title,
                                description: req.body.description,
                            }
                        );

                    res.status(201).json({
                        message: "Category created",
                        id: categoryId,
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
                    await this.categoriesService.updateCategory(
                        req.params.id,
                        req.user?.isAdmin ? "admin" : "user",
                        req.user?.id,
                        {
                            title: req.body.title,
                            description: req.body.description,
                        }
                    );

                    res.json({
                        message: "Category updated",
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
                    await this.categoriesService.deleteCategory(
                        req.params.id,
                        req.user?.isAdmin ? "admin" : "user",
                        req.user?.id
                    );

                    res.json({
                        message: "Category deleted",
                    });
                } catch (err) {
                    next(err);
                }
            }
        );
    }
}

module.exports = CategoriesAPI;
