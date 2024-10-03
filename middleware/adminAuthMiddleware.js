const adminAuthMiddleware = (req, res, next) => {
    if (!req.session || !req.session.admin) {
        return res.redirect('/login');
    }
    res.locals.adminName = req.session.admin.name;
    next();
};

module.exports = adminAuthMiddleware;