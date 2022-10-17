const AdminJS = require("adminjs");
const AdminJSExpress = require("@adminjs/express");
const { Database, Resource } = require("@adminjs/sequelize");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const bcrypt = require("bcrypt");

/**
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {typeof import('sequelize').Model} User
 */
exports.init = async function (sequelize, { User }) {
    const authenticate = async (login, password) => {
        const user = await User.findOne({
            where: {
                login,
            },
        });

        if (!user || user.role !== "admin") return null;

        const passwordCheck = await bcrypt.compare(password, user.password);

        if (!passwordCheck) {
            return null;
        }

        return Promise.resolve(user.login);
    };

    const store = new SequelizeStore({
        db: sequelize,
        table: "Session",
        expiration: 1000 * 60 * 60,
        checkExpirationInterval: 1000 * 60 * 30,
    });

    await store.sync();

    const appSession = session({
        secret: process.env.SESSION_SECRET,
        store: store,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 },
    });

    AdminJS.registerAdapter({
        Database,
        Resource,
    });

    const adminOptions = {
        databases: [sequelize],
    };

    const admin = new AdminJS(adminOptions);
    const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
        admin,
        {
            authenticate,
            cookiePassword: process.env.SESSION_SECRET,
        },
        null,
        {
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
        }
    );

    return { admin, adminRouter, appSession };
};
