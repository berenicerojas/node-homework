const authMiddleware = (req, res, next) => {
  if (!global.user_id) {
    return res.status(401).json({ message: "unauthorized" });
  }
  next();
};

module.exports = authMiddleware;