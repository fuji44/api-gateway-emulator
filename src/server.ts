import express, { NextFunction, Request, Response } from "express";
import jwt from "express-jwt";
import JwksRsa from "jwks-rsa";
import { createProxyMiddleware } from "http-proxy-middleware";
import base64url from "base64url";
import { readFileSync } from "fs";

type AuthenticatedRequest = Request & { user: object };

function createAuthMiddleware(authType: string): express.RequestHandler {
  switch (authType) {
    case "dummy_jwt": {
      const jwtJsonPath = process.env.DUMMY_JWT_JSON;
      if (!jwtJsonPath) {
        console.error(
          "\x1b[31m",
          "Error: If AUTH_TYPE=dummy_jwt, the environment variable DUMMY_JWT_JSON needs to be set to the path of the JWT file in JSON format."
        );
        process.exit(1);
      }
      let jwt: object;
      try {
        jwt = JSON.parse(readFileSync(jwtJsonPath, "utf-8"));
      } catch (error: any) {
        if (error.code && error.code == "ENOENT") {
          console.error(
            "\x1b[31m",
            "Error: The file set to DUMMY_JWT_JSON cannot be found.",
            jwtJsonPath
          );
          process.exit(1);
        }
        if (error instanceof SyntaxError) {
          console.error(
            "\x1b[31m",
            "Error: Failed to parse JSON.",
            error.message,
            jwtJsonPath
          );
          process.exit(1);
        }
        throw error;
      }
      return (req, res, next) => {
        (req as AuthenticatedRequest).user = jwt;
        next();
      };
    }

    case "jwks": {
      const jwksUri = process.env.OAUTH_JWKS_URI;
      const issuer = process.env.OAUTH_ISSUER;
      const audience = process.env.OAUTH_AUDIENCE;
      const algorithms = process.env.OAUTH_TOKEN_SIGN_ALGORITHMS
        ? process.env.OAUTH_TOKEN_SIGN_ALGORITHMS.split(",")
        : ["RS256"];

      if (!jwksUri || !issuer || !audience) {
        console.error(
          "\x1b[31m",
          "Error: If AUTH_TYPE=jwks, the environment variables [OAUTH_JWKS_URI, OAUTH_ISSUER, OAUTH_AUDIENCE] must be set."
        );
        process.exit(1);
      }

      return jwt({
        secret: JwksRsa.expressJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: jwksUri,
        }),
        issuer: issuer,
        audience: audience,
        algorithms: algorithms,
      });
    }

    default:
      console.error(
        "\x1b[31m",
        "Error: AUTH_TYPE must be one of [jwks, dummy_jwt]."
      );
      process.exit(1);
  }
}

function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("\x1b[31m", err.stack);
  res.status(500);
  if (err.message) {
    res.send({ error: err.message });
    return;
  }
  res.send({ error: err });
}

function run() {
  const verbose = process.env.VERBOSE ? Boolean(process.env.VERBOSE) : false;
  const targetUrl = process.env.TARGET_URL;
  if (!targetUrl) {
    console.error(
      "\x1b[31m",
      "Error: Required environment variables TARGET_URL are not defined."
    );
    process.exit(1);
  }

  const app = express();
  const authType = process.env.AUTH_TYPE
    ? process.env.AUTH_TYPE.toLowerCase()
    : "jwks";
  app.use(createAuthMiddleware(authType));
  app.use(
    process.env.BASE_PATH || "/",
    createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res, options) => {
        if (verbose) {
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

        if (verbose) {
          console.info(`after headers:`, proxyReq.getHeaders());
        }
      },
    })
  );
  app.use(errorHandler);

  const port = process.env.PORT || 3000;
  app.listen(port);

  console.log("Auth type:", authType);
  console.log("Running Gateway:", `http://localhost:${port}`);
}

run();
