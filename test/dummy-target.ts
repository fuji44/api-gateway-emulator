import base64url from "base64url";
import express from "express";

const verbose = process.env.VERBOSE ? Boolean(process.env.VERBOSE) : false;

const app = express();

app.get("/api/", (req: express.Request, res: express.Response) => {
  if (verbose) {
    console.log("headers:", req.headers);
    console.log(
      "jwt:",
      JSON.parse(
        base64url.decode(req.header("x-apigateway-api-userinfo") as string)
      )
    );
  }
  res.send("Access /");
});

app.get("/api/users/:q", (req: express.Request, res: express.Response) => {
  if (verbose) {
    console.log("headers:", req.headers);
    console.log(
      "jwt:",
      JSON.parse(
        base64url.decode(req.header("x-apigateway-api-userinfo") as string)
      )
    );
  }
  res.send(`Access /users/${req.params.q}`);
});

app.listen(5050, () => {
  console.log(`Example app listening`);
});
