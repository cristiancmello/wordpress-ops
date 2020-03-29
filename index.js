const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const express = require("express");
const consign = require("consign");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

consign()
  .include("models")
  .then("middleware")
  .then("routers")
  .into(app);

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  const result = await handler(event, context);
  return result;
};
