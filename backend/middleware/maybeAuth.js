const jwt = require('jsonwebtoken');
const User = require('../models/User');

const maybeAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.id) {
            const user = await User.findById(decoded.id).select('-password');
            if (user) req.user = user;
        }
        next();
    } catch (err) {
        // Even if token is invalid, we continue as guest
        next();
    }
};

module.exports = maybeAuth;
