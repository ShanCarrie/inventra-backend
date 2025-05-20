import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      access_token: string;
      id_token: string;
      refresh_token: string;
    };
  }
}
