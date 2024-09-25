const authenticate = (req, res, next) => {
    // Check for session ID in cookies
    const sessionId = req.cookies?.sessionId;
    if (!sessionId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // Assuming you are using a session store like express-session
    // Check if the session ID is valid
    req.sessionStore.get(sessionId, (err, session) => {
        if (err || !session) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        req.user = session.user;
        next();
    });
};

module.exports = authenticate;