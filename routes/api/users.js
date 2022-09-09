const {Router} = require('express');
const {Joi, validate} = require("express-validation");

const createUserValidation = {
    body: Joi.object({
        email: Joi.string().email().required(),
        login: Joi.string().required(),
        password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/).required(),
        passwordConfirmation: Joi.ref('password'),
        role: Joi.string().valid('user', 'admin').required()
    }).with('password', 'passwordConfirmation')
}

/**
 *
 * @param {typeof import('sequelize').Model} User
 * @param {Function} userMiddleware
 * @param {Function} createUser
 * @param {Function} avatarDataMiddleware
 * @param {Function} avatarUploadMiddleware
 * @param {Function} checkAuthTokenValidityMiddleware
 * @return {{router: Router}}
 */
function useUsers({
                      User,
                      userMiddleware,
                      createUser,
                      avatarDataMiddleware,
                      avatarUploadMiddleware,
                      checkAuthTokenValidityMiddleware
                  }) {

    const router = Router();

    router.get('/',
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
        [validate(createUserValidation), userMiddleware, checkAuthTokenValidityMiddleware],
        async function (req, res, next) {

            try {

                if (!req.user) {
                    return res.status(401).json({
                        name: 'Users Error',
                        message: 'Not Authorized'
                    })
                }

                const reqAuthor = await User.findByPk(req.user.id);

                if (reqAuthor.role !== 'admin') {
                    return res.status(403).json({
                        name: 'Users Error',
                        message: 'User is not an admin'
                    })
                }

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
                res.json({
                    message: 'Avatar was updated'
                });
            }
        })

    return {router}
}

module.exports = useUsers;
