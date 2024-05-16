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
  // Extract the Authorization header value
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No Authorization header" });
  }

  // Expecting the header to be in the format: Bearer <token>
  const tokenParts = authHeader.split(" ");

  if (tokenParts.length !== 2 || tokenParts[0].toLowerCase() !== "bearer") {
    return res
      .status(401)
      .json({ message: "Unauthorized: Malformed Authorization header" });
  }

  const token = tokenParts[1];

  if (!token || token.length === 0 || token === null || token === undefined) {
    return res.status(401).json({ message: "Unauthorized: Empty token" });
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
