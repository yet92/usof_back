const {Router} = require('express');
const {Joi, validate} = require("express-validation");

const createUserValidation = {
    body: Joi.object({
        email: Joi.string().email().required(),
        login: Joi.string().required().min(1),
        password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/).required(),
        passwordConfirmation: Joi.ref('password'),
        role: Joi.string().valid('user', 'admin').required()
    }).with('password', 'passwordConfirmation')
}

const updateUserValidation = {
    body: Joi.object({
        newUserData: Joi.object(
            {
                email: Joi.string().email(),
                login: Joi.string().min(1),
                password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
                passwordConfirmation: Joi.ref('password'),
                role: Joi.string().valid('user', 'admin'),
                fullName: Joi.string().regex(/^(\p{L})+( ?(\p{L})+)*$/u),
                rating: Joi.number(),
                isEmailConfirmed: Joi.boolean()
            }
        )
    })
}

/**
 *
 * @param {typeof import('sequelize').Model} User
 * @param {Function} createUser
 * @param {Function} userMiddleware
 * @param {Function} adminMiddleware
 * @param {Function} avatarDataMiddleware
 * @param {Function} avatarUploadMiddleware
 * @param {Function} checkAuthTokenValidityMiddleware
 * @return {{router: Router}}
 */
function useUsers({
                      User,
                      createUser,
                      userMiddleware,
                      adminMiddleware,
                      avatarDataMiddleware,
                      onlyAdminsMiddleware,
                      avatarUploadMiddleware,
                      checkAuthTokenValidityMiddleware
                  }) {

    const router = Router();

    router.get('/',
        [userMiddleware, checkAuthTokenValidityMiddleware, adminMiddleware, onlyAdminsMiddleware],
        async function (req, res, next) {

            try {
                const users = await User.findAll({
                    attributes: {exclude: ['password']}
                });

                res.json({users});

            } catch (err) {
                next(err);
            }

        })

    router.get('/:id',
        [userMiddleware, adminMiddleware, onlyAdminsMiddleware],
        async function (req, res, next) {

            try {

                const {id} = req.params;

                const user = await User.findByPk(id, {
                    attributes: {exclude: ['password']}
                });

                res.json({user});


            } catch (err) {
                next(err);
            }

        })

    router.post('/',
        [userMiddleware, checkAuthTokenValidityMiddleware, adminMiddleware, onlyAdminsMiddleware, validate(createUserValidation)],
        async function (req, res, next) {

            try {

                const {login, password, email, role} = req.body;

                try {
                    await createUser({login, email, password, role, isEmailConfirmed: true});
                } catch (err) {
                    if (err.name === 'Create User Error') {
                        return res.status(400).json(err);
                    } else {
                        next(err);
                    }
                }

                res.status(201).json({
                    message: 'User Created'
                });

            } catch (err) {
                next(err);
            }

        })

    router.patch('/avatar',
        [userMiddleware, checkAuthTokenValidityMiddleware, avatarDataMiddleware, avatarUploadMiddleware.single('avatar')],
        async function (req, res, next) {
            if (!req.file) {
                res.status(400).json({
                    name: 'Upload Avatar Error',
                    message: 'Avatar is required'
                })
            } else {

                const user = await User.findByPk(req.user.id);

                user.profilePicture = req.avatarFileName;

                await user.save();

                res.json({
                    message: 'Avatar was updated'
                });
            }
        })

    router.patch('/:id',
        [userMiddleware, checkAuthTokenValidityMiddleware, adminMiddleware, validate(updateUserValidation)],
        async function (req, res, next) {

            if (!req.user) {
                return res.status(401).json({
                    name: 'Patch User Error',
                    message: 'Not Authorized'
                })
            }

            try {
                const {newUserData} = req.body;

                let user = null;

                if (req.user.id === req.params.id) {
                    user = await User.findByPk(req.user.id);

                    await user.update(newUserData);

                } else {

                    if (!req.user.isAdmin) {
                        return res.status(403).json({
                            name: 'Patch User Error',
                            message: 'Not Authorized'
                        })
                    }

                    user = await User.findByPk(req.user.id);

                    if (user.role === 'admin') {
                        return res.status(403).json({
                            name: 'Patch User Error',
                            message: 'User is admin'
                        })
                    }

                    await user.update(newUserData);
                }

                res.json({
                    message: 'User Updated'
                })
            } catch (err) {
                next(err);
            }

        });

    router.delete('/:id',
        [userMiddleware, checkAuthTokenValidityMiddleware, adminMiddleware],
        async function (req, res, next) {

            if (!req.user) {
                return res.status(401).json({
                    name: 'Patch User Error',
                    message: 'Not Authorized'
                })
            }

            try {

                let user = null;

                if (req.user.id === req.params.id) {
                    user = await User.findByPk(req.user.id);

                    await user.destroy();

                } else {

                    if (!req.user.isAdmin) {
                        return res.status(403).json({
                            name: 'Patch User Error',
                            message: 'Not Authorized'
                        })
                    }

                    user = await User.findByPk(req.params.id);

                    if (user.role === 'admin') {
                        return res.status(403).json({
                            name: 'Patch User Error',
                            message: 'User is admin'
                        })
                    }

                    await user.destroy();
                }

                return res.json({
                    message: 'User Deleted'
                })
            } catch (err) {
                next(err);
            }
        });
    return {router}

}

module.exports = useUsers;
