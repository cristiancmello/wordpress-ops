#!/usr/bin/env node

const cdk = require("@aws-cdk/core");
const { StationMakerStack } = require("../lib/station-maker-stack");

const app = new cdk.App();
new StationMakerStack(app, "StationMakerStack", {
  env: {
    account: 417421622039,
    region: "us-east-1"
  }
});
