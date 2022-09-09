const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

require('dotenv').config();
const db = require('./db');
const usersLib = require('./lib/users');
const parseError = require('./lib/errorParser');
const passwordReset = require('./lib/passwordReset');
const {ValidationError} = require("express-validation");
const {user: userMiddleware, useAvatarUpload, useAvatarData} = require('./lib/middlewares');
const emailConfirmation = require("./lib/emailConfirmation");

const useAuth = require('./routes/api/auth');
const useUsers = require('./routes/api/users');
const useVerifyEmail = require('./routes/api/verifyEmail');

async function setup() {
    const app = express();

    const {User, Post, Comment, Like, Category, ConfirmationToken, AuthToken, PasswordResetToken} = await db.init({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });

    const {avatarData: avatarDataMiddleware} = useAvatarData({User, AuthToken});
    const {avatarUpload: avatarUploadMiddleware} = useAvatarUpload(path.join(__dirname, 'public', 'images', 'avatars'));

    const {confirmEmail, createEmailConfirmation} = emailConfirmation.init(ConfirmationToken, User);
    const {resetPassword, createPasswordReset} = passwordReset.init(PasswordResetToken, User);
    const {createUser} = usersLib.init({User});

    const {router: authAPIRouter} = useAuth({
        User,
        AuthToken,
        createEmailConfirmation,
        createPasswordReset,
        resetPassword,
        userMiddleware,
        createUser
    });
    const {router: verifyEmailAPIRouter} = useVerifyEmail(confirmEmail);
    const {router: usersAPIRouter} = useUsers({
        User,
        createUser,
        userMiddleware,
        avatarDataMiddleware,
        avatarUploadMiddleware
    });


    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({extended: false}));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/api/auth', authAPIRouter);
    app.use('/api/verifyEmail', verifyEmailAPIRouter);
    app.use('/api/users', usersAPIRouter);

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        next(createError(404));
    });

    // error handler
    app.use(function (err, req, res, next) {

        if (err instanceof ValidationError) {
            const error = parseError(err);
            return res.status(err.statusCode).json(error);
        }

        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });

    return app;

}

module.exports = setup;


