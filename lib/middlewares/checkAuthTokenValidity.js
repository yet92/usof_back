const jwt = require("jsonwebtoken");

function useCheckAuthTokenValidity({ AuthToken }) {
    async function checkAuthTokenValidity(req, res, next) {
        if (req.method === "OPTIONS") {
            return next;
        }

        try {
            if (!req.user) {
                return next();
            }

            const token = req.headers.authorization.split(" ")[1];

            const authToken = await AuthToken.findOne({
                where: {
                    user_id: req.user.id,
                    token,
                },
            });

            if (!authToken) req.user = null;
        } catch (err) {}

        return next();
    }

    return { checkAuthTokenValidity };
}

module.exports = useCheckAuthTokenValidity;
