#!/usr/bin/env node

const cdk = require("@aws-cdk/core");
const { StationMakerStack } = require("../lib/station-maker-stack");
const { stationInput } = require("./loadStationInput");

const app = new cdk.App();

new StationMakerStack(app, stationInput.stackName, {
  env: {
    account: stationInput.credentials.account,
    region: stationInput.credentials.aws_region
  }
});
