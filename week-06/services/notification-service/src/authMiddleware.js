import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export function authenticateSseRequest(req, res, next) {
  try {
    const authorization = req.header("authorization") || "";
    const bearerToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;
    const token = req.query.token || bearerToken;

    if (!token || typeof token !== "string") {
      return res.status(401).json({
        message: "Missing token"
      });
    }

    const payload = jwt.verify(token, JWT_SECRET);

    req.user = {
      studentId: payload.studentId || payload.sub,
      email: payload.email,
      name: payload.name
    };

    if (!req.user.studentId) {
      return res.status(401).json({
        message: "Invalid token payload"
      });
    }

    return next();
  } catch (_error) {
    return res.status(401).json({
      message: "Invalid token"
    });
  }
}

