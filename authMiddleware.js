const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    // Safely handle missing cookies or headers

    console.log("req.cookies", req.cookies?.auth_token);
    console.log("req.headers", req.headers?.auth_token);
    
    const token =
      (req.cookies && req.cookies?.auth_token) || 
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      // return res.redirect("/login");
      return res.status(401).json({ msg: "Access Denied: No Token Provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ msg: "Invalid or Expired Token" });
      }
      req.user = decoded; // Attach user info to req.user
      next(); // Proceed to next middleware
    });
  } catch (error) {
    res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
};

module.exports = verifyToken;
