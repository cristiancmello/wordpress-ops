"use strict";

const fs = require("fs");
const shell = require("shelljs");

const getCdkOutputPath = () => {
  let path = `/tmp/cdk.out`;

  if (process.env.APP_ENV === "local") {
    path = "cdk.out";
  }

  return path;
};

const cdkOutputPath = getCdkOutputPath();
const stationInputFilePath = `${cdkOutputPath}/station.input.json`;

const stationInput = JSON.parse(
  fs.readFileSync(stationInputFilePath).toString()
);

module.exports.stationInput = stationInput;
