"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const querystring_1 = __importDefault(require("querystring"));
const cookie = __importStar(require("cookie"));
const router = express_1.default.Router();
const { COGNITO_DOMAIN, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET, COGNITO_REDIRECT_URI, POST_LOGIN_REDIRECT, } = process.env;
if (!COGNITO_DOMAIN ||
    !COGNITO_CLIENT_ID ||
    !COGNITO_CLIENT_SECRET ||
    !COGNITO_REDIRECT_URI ||
    !POST_LOGIN_REDIRECT) {
    throw new Error("Missing one or more required environment variables.");
}
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send("Missing code in callback");
    }
    try {
        const tokenUrl = `${COGNITO_DOMAIN}/oauth2/token`;
        const response = yield axios_1.default.post(tokenUrl, querystring_1.default.stringify({
            grant_type: "authorization_code",
            code,
            client_id: COGNITO_CLIENT_ID,
            redirect_uri: COGNITO_REDIRECT_URI,
        }), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: "Basic " +
                    Buffer.from(`${COGNITO_CLIENT_ID}:${COGNITO_CLIENT_SECRET}`).toString("base64"),
            },
        });
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
    }
    catch (error) {
        if (error.response) {
            console.error("Token exchange failed:", error.response.data);
        }
        else {
            console.error("Token exchange error:", error.message);
        }
        res.status(500).send("Authentication failed");
    }
}));
exports.default = router;
