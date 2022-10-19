const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const { Router } = require("express");
const { Joi, validate } = require("express-validation");

const registerValidation = {
    body: Joi.object({
        email: Joi.string().email().required(),
        login: Joi.string().required(),
        password: Joi.string()
            .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
            .required(),
        passwordConfirmation: Joi.ref("password"),
    }).with("password", "passwordConfirmation"),
};

const loginValidation = {
    body: Joi.object({
        login: Joi.string(),
        email: Joi.string().email(),
        password: Joi.string().required(),
    }).or("login", "email"),
};

const passwordResetRequestValidation = {
    body: Joi.object({
        email: Joi.string().email().required(),
    }),
};

const passwordResetValidation = {
    body: Joi.object({
        newPassword: Joi.string()
            .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
            .required(),
    }),
};

function generateUserToken(user) {
    return jwt.sign(
        {
            id: user.id,
        },
        process.env.JWT_SECRET_KEY
    );
}

/**
 *
 * @param {typeof import('sequelize').Model} User
 * @param {typeof import('sequelize').Model} AuthToken
 * @param {Function} createEmailConfirmation
 * @param {Function} createPasswordReset
 * @param {Function} resetPassword
 * @param {Function} userMiddleware
 * @param {Function} createUser
 * @return {{router: Router}}
 */
function useAuth({
    User,
    AuthToken,
    createEmailConfirmation,
    createPasswordReset,
    resetPassword,
    userMiddleware,
    createUser,
}) {
    const router = Router();

    router.post(
        "/register",
        [validate(registerValidation)],
        async function (req, res, next) {
            try {
                const { login, email, password } = req.body;

                let user;

                try {
                    user = await createUser({ login, email, password });
                } catch (err) {
                    if (err.name === "Create User Error") {
                        err.name = "Register Error";
                        return res.status(400).json(err);
                    } else {
                        throw err;
                    }
                }

                createEmailConfirmation(user);

                res.status(201).json({
                    message: "Success register",
                });
            } catch (err) {
                next(err);
            }
        }
    );

    router.post(
        "/login",
        [validate(loginValidation)],
        async function (req, res, next) {
            try {
                const { login, email, password } = req.body;

                const user = await User.findOne({
                    where: {
                        [Op.or]: [
                            { login: login || "" },
                            { email: email || "" },
                        ],
                    },
                });

                if (!user) {
                    const error = {
                        name: "Login Error",
                        message: "User not found",
                    };
                    return res.status(404).json(error);
                }

                if (!user.isEmailConfirmed) {
                    const error = {
                        name: "Login Error",
                        message: "Confirm email",
                    };
                    return res.status(403).json(error);
                }

                const passwordCheck = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!passwordCheck) {
                    const error = {
                        name: "Login Error",
                        message: "Invalid password",
                    };
                    return res.status(403).json(error);
                }

                const token = generateUserToken(user);

                const authToken = await AuthToken.build({
                    token,
                });

                await authToken.setUser(user);

                await authToken.save();

                res.status(200).json({
                    message: "Success login",
                    user: {
                        token,
                        id: user.id,
                        login,
                        fullName: user.fullName
                    }
                });
            } catch (err) {
                next(err);
            }
        }
    );

    router.post("/logout", [userMiddleware], async function (req, res, next) {
        try {
            // console.log(JSON.stringify(req.user));

            if (!req.user) {
                return res.status(401).json({
                    name: "Logout Error",
                    message: "Not Authorized",
                });
            }

            const token = req.headers.authorization.split(" ")[1];

            const authToken = await AuthToken.findOne({
                where: {
                    [Op.and]: [{ user_id: req.user.id }, { token }],
                },
            });

            if (!authToken) {
                return res.status(401).json({
                    name: "Logout Error",
                    message: "Not Authorized",
                });
            }

            await authToken.destroy();

            res.status(200).json({
                message: "Success Logout",
            });
        } catch (err) {
            console.log(err);
            next(err);
        }
    });

    router.post(
        "/password-reset",
        [validate(passwordResetRequestValidation)],
        async function (req, res, next) {
            try {
                const { email } = req.body;

                const user = await User.findOne({
                    where: { email },
                });

                if (!user) {
                    return res.status(404).json({
                        name: "Password Reset Error",
                        message: "Invalid email",
                    });
                }

                createPasswordReset(user);

                res.json({
                    message: "Reset password link on your email",
                });
            } catch (err) {
                next(err);
            }
        }
    );

    router.post(
        "/password-reset/:token",
        [validate(passwordResetValidation)],
        async function (req, res, next) {
            try {
                const { token } = req.params;
                const { newPassword } = req.body;

                await resetPassword(token, newPassword);

                res.json({
                    message: "Password was changed",
                });
            } catch (err) {
                if (err.message === "No such password reset token") {
                    res.status(404).json({
                        name: "Password Reset Error",
                        message: "Invalid token",
                    });
                } else {
                    next(err);
                }
            }
        }
    );

    router.get("/password-reset/:token", async function (req, res, next) {
        const { token } = req.params;
        res.render("passwordReset", { token });
    });

    return { router };
}

module.exports = useAuth;
