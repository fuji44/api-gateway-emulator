import express, { Request } from "express";
import jwt from "express-jwt";
import JwksRsa from "jwks-rsa";
import { createProxyMiddleware } from "http-proxy-middleware";
import base64url from "base64url";

const VERBOSE = process.env.VERBOSE ? Boolean(process.env.VERBOSE) : false;

const PORT = process.env.PORT || 3000;
const TARGET_URL = process.env.TARGET_URL;
const BASE_PATH = process.env.BASE_PATH || "/";

const OAUTH_JWKS_URI = process.env.OAUTH_JWKS_URI;
const OAUTH_ISSUER = process.env.OAUTH_ISSUER;
const OAUTH_AUDIENCE = process.env.OAUTH_AUDIENCE;
const OAUTH_TOKEN_SIGN_ALGORITHMS = process.env.OAUTH_TOKEN_SIGN_ALGORITHMS
  ? process.env.OAUTH_TOKEN_SIGN_ALGORITHMS.split(",")
  : ["RS256"];

if (!TARGET_URL || !OAUTH_JWKS_URI || !OAUTH_ISSUER || !OAUTH_AUDIENCE) {
  console.error(
    "\x1b[31m",
    "Error: Required environment variables [TARGET_URL, OAUTH_JWKS_URI, OAUTH_ISSUER, OAUTH_AUDIENCE] are not defined."
  );
  process.exit(1);
}

const app = express();
app.use(
  jwt({
    secret: JwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: OAUTH_JWKS_URI,
    }),
    issuer: OAUTH_ISSUER,
    audience: OAUTH_AUDIENCE,
    algorithms: OAUTH_TOKEN_SIGN_ALGORITHMS,
  })
);

type AuthenticatedRequest = Request & { user: object };

app.use(
  BASE_PATH,
  createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res, options) => {
      if (VERBOSE) {
        console.info(`before headers:`, proxyReq.getHeaders());
      }

      proxyReq.setHeader(
        "x-apigateway-api-userinfo",
        base64url.encode(JSON.stringify((req as AuthenticatedRequest).user))
      );
      const authorization = req.header("authorization");
      if (authorization) {
        proxyReq.setHeader("x-forwarded-authorization", authorization);
      }

      if (VERBOSE) {
        console.info(`after headers:`, proxyReq.getHeaders());
      }
    },
  })
);
app.listen(PORT);
