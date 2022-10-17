const jwt = require("jsonwebtoken");

function useAdmin({ User }) {
    async function admin(req, res, next) {
        if (req.method === "OPTIONS") {
            return next;
        }

        try {
            if (req.user) {
                const user = await User.findByPk(req.user.id);
                if (user && user.role === "admin") {
                    req.user.isAdmin = true;
                }
                return next();
            }
        } catch (err) {
            return next(err);
        }

        next();
    }
    return { admin };
}

module.exports = useAdmin;
