import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase.js";

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
