const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

require("dotenv").config();
const adminJS = require("./lib/adminJS");
const db = require("./repositories");
const usersLib = require("./lib/users");
const parseError = require("./lib/errorParser");
const passwordReset = require("./lib/passwordReset");
const { ValidationError } = require("express-validation");
const {
    useAdmin,
    useAvatarData,
    useAvatarUpload,
    user: userMiddleware,
    useCheckAuthTokenValidity,
    onlyAdmins: onlyAdminsMiddleware,
} = require("./lib/middlewares");
const emailConfirmation = require("./lib/emailConfirmation");

const {
    createDefaultUser,
    createDefaultAdminUser,
} = require("./lib/helpers/defaultDataCreation/createDefaultUsers");
const {
    createDefaultCategories,
} = require("./lib/helpers/defaultDataCreation/createDefaultCategories");

const {
    PostsService,
    CategoriesService,
    CommentsService,
} = require("./lib/services");

const useAuth = require("./routes/api/auth");
const useUsers = require("./routes/api/users");
const useVerifyEmail = require("./routes/api/verifyEmail");
const PostsAPI = require("./routes/api/posts");
const CategoriesAPI = require("./routes/api/categories");
const CommentsAPI = require("./routes/api/comments");
const {
    RecordNotFound,
    NotEnoughRights,
    MustBeUnique,
} = require("./lib/helpers/errors");
const { generateData } = require("./lib/debug");

async function setup() {
    const app = express();

    const {
        User,
        Post,
        Comment,
        Like,
        Category,
        ConfirmationToken,
        AuthToken,
        PasswordResetToken,
        sequelize,
    } = await db.init({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    });

    const { createUser } = usersLib.init({ User });

    await createDefaultAdminUser({ createUser, email: process.env.ADMIN_EMAIL, login: process.env.ADMIN_LOGIN, password: process.env.ADMIN_PASSWORD });

    if (Number(process.env.GENERATE_DATA) === 1) {
        if ((await Post.findAll({limit: 1})).length) {
            console.error('Remove all data from database to generate new');
        } else {
            generateData(createUser, {
                Post,
                Like,
                Comment,
                Category
            })
        }
    }

    const { admin: adminMiddleware } = useAdmin({ User });
    const { avatarData: avatarDataMiddleware } = useAvatarData({
        User,
        AuthToken,
    });
    const { avatarUpload: avatarUploadMiddleware } = useAvatarUpload(
        path.join(__dirname, "public", "images", "avatars")
    );
    const { checkAuthTokenValidity: checkAuthTokenValidityMiddleware } =
        useCheckAuthTokenValidity({ AuthToken });

    const { confirmEmail, createEmailConfirmation } = emailConfirmation.init(
        ConfirmationToken,
        User
    );
    const { resetPassword, createPasswordReset } = passwordReset.init({
        PasswordResetToken,
        User,
        AuthToken,
    });
    
    // await createDefaultUser({ createUser });
    // await createDefaultCategories(Category);

    const { router: authAPIRouter } = useAuth({
        User,
        AuthToken,
        createUser,
        resetPassword,
        userMiddleware,
        createPasswordReset,
        createEmailConfirmation,
    });
    const { router: verifyEmailAPIRouter } = useVerifyEmail(confirmEmail);
    const { router: usersAPIRouter } = useUsers({
        User,
        createUser,
        userMiddleware,
        adminMiddleware,
        avatarDataMiddleware,
        onlyAdminsMiddleware,
        avatarUploadMiddleware,
        checkAuthTokenValidityMiddleware,
    });

    const postsService = new PostsService({
        Post,
        Comment,
        Like,
        Category,
        sequelize,
    });
    const postsAPI = new PostsAPI(postsService, {
        user: userMiddleware,
        admin: adminMiddleware,
        checkAuthValidity: checkAuthTokenValidityMiddleware,
    });

    const categoriesService = new CategoriesService({ Category });
    const categoriesAPI = new CategoriesAPI(categoriesService, {
        user: userMiddleware,
        checkAuthValidity: checkAuthTokenValidityMiddleware,
        admin: adminMiddleware,
    });

    const commentsService = new CommentsService(Comment, Like);
    const commentsAPI = new CommentsAPI(commentsService, {
        user: userMiddleware,
        checkAuthValidity: checkAuthTokenValidityMiddleware,
        admin: adminMiddleware,
    });

    const { admin, adminRouter, appSession } = await adminJS.init(sequelize, {
        User,
    });

    // view engine setup
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "ejs");

    app.use(appSession);
    app.use(admin.options.rootPath, adminRouter);
    app.admin = admin;

    app.use(logger("dev"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, "public")));

    app.use(cors());

    app.use("/api/auth", authAPIRouter);
    app.use("/api/verifyEmail", verifyEmailAPIRouter);
    app.use("/api/users", usersAPIRouter);
    app.use("/api/posts", postsAPI.router);
    app.use("/api/categories", categoriesAPI.router);
    app.use("/api/comments", commentsAPI.router);

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

        if (err instanceof RecordNotFound) {
            return res.status(404).json({
                message: err.message,
            });
        }

        if (err instanceof NotEnoughRights) {
            return res.status(err.statusCode).json({
                message: err.message,
            });
        }

        if (err instanceof MustBeUnique) {
            return res.status(err.statusCode).json({
                message: err.message,
            });
        }

        if (err.status === 404) {
            return res.status(404).json({
                message: 'Not found'
            })
        }

        // set locals, only providing error in development
        res.locals.message =
            process.env.ENV === "DEVELOPMENT"
                ? err.message
                : "Something went wrong";
        res.locals.error = process.env.ENV === "DEVELOPMENT" ? err : {};
        
        // render the error page
        res.status(err.status || 500).json({
            message: res.locals.message
        });
    });

    return app;
}

module.exports = setup;
