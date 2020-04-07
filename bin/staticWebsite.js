#!/usr/bin/env node

const cdk = require("@aws-cdk/core");
const { StaticWebsiteStack } = require("../lib/staticWebsiteStack");
const { stationInput } = require("./loadStationInput");

const app = new cdk.App();

new StaticWebsiteStack(app, stationInput.stackName, {
  env: {
    account: stationInput.credentials.account,
    region: stationInput.credentials.aws_region,
  },
});
