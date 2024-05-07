import express from "express";
import jwt from "jsonwebtoken";

// we need to extend the default type so typescript
// will stop complaining
interface CustomRequest extends express.Request {
  userId?: string;
}

export default function verifyJWT(
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) {
  // Check if req.cookies is defined
  if (!req.cookies) {
    return res.status(401).json({ message: "Unauthorized: No cookies sent" });
  }

  // extract token from cookie
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token" });
  }

  try {
    // verify token using secret key
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);

    req.userId = (decodedToken as { userId: string }).userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}
