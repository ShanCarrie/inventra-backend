import express, { Request, Response } from "express";
import * as cookie from "cookie";
import { jwtDecode } from "jwt-decode";

const router = express.Router();
// Expected token structure
type TokenPayload = {
  given_name?: string;
  family_name?: string;
  email?: string;
  username?: string;
};

router.get("/me", (req: Request, res: Response): void => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const idToken = cookies.idToken;

    if (!idToken) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const decoded = jwtDecode<TokenPayload>(idToken); // This does not verify the token's signature
    console.log("Decoded user:", decoded);
    res.json({ user: decoded }); // Sent to frontend
  } catch (error) {
    console.error("Failed to decode token:", error);
    res.status(400).json({ message: "Invalid token" });
  }
});

export default router;
