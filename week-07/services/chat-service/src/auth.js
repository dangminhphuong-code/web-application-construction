import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

function mapJwtPayload(payload) {
  return {
    studentId: payload.studentId || payload.sub,
    email: payload.email,
    name: payload.name
  };
}

function extractHttpToken(req) {
  const authorization = req.header("authorization") || "";

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  return req.query.token;
}

export function authenticateHttp(req, res, next) {
  try {
    const token = extractHttpToken(req);

    if (!token || typeof token !== "string") {
      return res.status(401).json({
        message: "Missing token"
      });
    }

    req.user = mapJwtPayload(jwt.verify(token, JWT_SECRET));

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

export function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token || typeof token !== "string") {
      return next(new Error("Missing token"));
    }

    socket.user = mapJwtPayload(jwt.verify(token, JWT_SECRET));

    if (!socket.user.studentId) {
      return next(new Error("Invalid token payload"));
    }

    return next();
  } catch (_error) {
    return next(new Error("Invalid token"));
  }
}

