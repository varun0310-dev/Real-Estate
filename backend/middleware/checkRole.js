const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.userType)) {
            return res.status(403).json({ message: 'Access denied: role not permitted' });
        }
        next();
    };
};

module.exports = checkRole;