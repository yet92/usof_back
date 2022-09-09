
const jwt = require('jsonwebtoken');

function user(req, res, next) {

    if (req.method === 'OPTIONS') {
        return next;
    }

    try {

        const token = req.headers.authorization.split(' ')[1];

        if (!token) {
            return next();
        }

        req.user = jwt.verify(token, process.env.JWT_SECRET_KEY);

    } catch (err) {}

    next();
}

module.exports = user;
