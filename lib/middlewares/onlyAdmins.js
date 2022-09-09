

const jwt = require('jsonwebtoken');

function onlyAdmins(req, res, next) {

    if (req.method === 'OPTIONS') {
        return next;
    }

    try {

        if (!req.user) {
            return res.status(401).json({
                message: 'Not Authorized'
            })
        }

        if (!req.user.isAdmin) {
            return res.status(403).json({
                message: 'User is not an admin'
            })
        }

    } catch (err) {}

    next();
}

module.exports = onlyAdmins;

