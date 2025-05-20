import express from "express";
import * as cookie from "cookie";

const router = express.Router();

const { COGNITO_DOMAIN, COGNITO_CLIENT_ID, POST_LOGOUT_REDIRECT } = process.env;

// Validate required env variables
if (!COGNITO_DOMAIN || !COGNITO_CLIENT_ID || !POST_LOGOUT_REDIRECT) {
  throw new Error("Missing required environment variables for logout route.");
}

router.get("/", (req, res) => {
  // Clear authentication cookies
  res.setHeader("Set-Cookie", [
    cookie.serialize("idToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    }),
    cookie.serialize("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    }),
  ]);

  // Redirect to Cognito logout URL
  const logoutUrl = new URL(`${COGNITO_DOMAIN}/logout`);
  logoutUrl.searchParams.set("client_id", COGNITO_CLIENT_ID);
  logoutUrl.searchParams.set("logout_uri", POST_LOGOUT_REDIRECT);

  return res.redirect(logoutUrl.toString());
});

export default router;
