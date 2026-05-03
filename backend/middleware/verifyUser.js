const jwt = require('jsonwebtoken');

const verifyUser = (req, res, next) => {
  const token = req.cookies?.vitalis_session;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid session" });
  }
};

module.exports = verifyUser;