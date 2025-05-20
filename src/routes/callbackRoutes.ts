import express, { Request, Response } from "express";
import axios from "axios";
import qs from "querystring";
import * as cookie from "cookie";

const router = express.Router();

const {
  COGNITO_DOMAIN,
  COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET,
  COGNITO_REDIRECT_URI,
  POST_LOGIN_REDIRECT,
} = process.env;

if (
  !COGNITO_DOMAIN ||
  !COGNITO_CLIENT_ID ||
  !COGNITO_CLIENT_SECRET ||
  !COGNITO_REDIRECT_URI ||
  !POST_LOGIN_REDIRECT
) {
  throw new Error("Missing one or more required environment variables.");
}

router.get("/", async (req: Request, res: Response): Promise<any> => {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).send("Missing code in callback");
  }

  try {
    const tokenUrl = `${COGNITO_DOMAIN}/oauth2/token`;

    const response = await axios.post(
      tokenUrl,
      qs.stringify({
        grant_type: "authorization_code",
        code,
        client_id: COGNITO_CLIENT_ID,
        redirect_uri: COGNITO_REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              `${COGNITO_CLIENT_ID}:${COGNITO_CLIENT_SECRET}`
            ).toString("base64"),
        },
      }
    );

    const { id_token, refresh_token } = response.data;

    res.setHeader("Set-Cookie", [
      cookie.serialize("idToken", id_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      }),
      cookie.serialize("refreshToken", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      }),
    ]);

    res.redirect(POST_LOGIN_REDIRECT);
  } catch (error: any) {
    if (error.response) {
      console.error("Token exchange failed:", error.response.data);
    } else {
      console.error("Token exchange error:", error.message);
    }
    res.status(500).send("Authentication failed");
  }
});

export default router;
