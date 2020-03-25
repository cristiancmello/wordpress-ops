#!/usr/bin/env node

const cdk = require("@aws-cdk/core");
const { StationMakerStack } = require("../lib/station-maker-stack");
const { stationInput } = require("./loadStationInput");

process.env.DEPLOYMENT_ID = stationInput.deploymentId;
process.env.STACK_NAME = stationInput.stackName;

const app = new cdk.App();
new StationMakerStack(app, stationInput.stackName, {
  env: {
    account: stationInput.account,
    region: stationInput.aws_region
  }
});
