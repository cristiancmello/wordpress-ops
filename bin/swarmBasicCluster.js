#!/usr/bin/env node

const cdk = require("@aws-cdk/core");
const { SwarmBasicClusterStack } = require("../lib/swarmBasicClusterStack");
const { stationInput } = require("./loadStationInput");

const app = new cdk.App();

new SwarmBasicClusterStack(app, stationInput.stackName, {
  env: {
    account: stationInput.credentials.account,
    region: stationInput.credentials.aws_region,
  },
});
