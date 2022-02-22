import express from "express";

const VERBOSE = process.env.VERBOSE ? Boolean(process.env.VERBOSE) : false;

const app = express();

app.get("/api/", (req: express.Request, res: express.Response) => {
  if (VERBOSE) {
    console.log(JSON.stringify(req.headers));
  }
  res.send("Access /");
});

app.get("/api/users/:q", (req: express.Request, res: express.Response) => {
  if (VERBOSE) {
    console.log(JSON.stringify(req.headers));
  }
  res.send(`Access /users/${req.params.q}`);
});

app.listen(5050, () => {
  console.log(`Example app listening`);
});
