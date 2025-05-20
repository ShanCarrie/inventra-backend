import express from "express";

const router = express.Router();

const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN!;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;
const REDIRECT_URI = process.env.COGNITO_REDIRECT_URI!;

router.get("/", (req, res) => {
  const loginUrl = `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=${REDIRECT_URI}`;
  res.redirect(loginUrl);
});

export default router;
