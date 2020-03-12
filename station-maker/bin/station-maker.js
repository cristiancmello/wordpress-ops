#!/usr/bin/env node

const cdk = require("@aws-cdk/core");
const { StationMakerStack } = require("../lib/station-maker-stack");

const app = new cdk.App();
new StationMakerStack(app, "StationMakerStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
