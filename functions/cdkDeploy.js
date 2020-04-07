"use strict";

const fs = require("fs");
const shell = require("shelljs");

const Deployment = require("../models/deployment");
const Station = require("../models/station");
const StationProfile = require("../models/stationProfile");

const {
  generateAwsProfileCommandConfig,
} = require("../helpers/generateAwsProfileConfig");

const getAwsProfileConfigFilePath = (profileName) => {
  let path = `/tmp/.aws.${profileName}`;

  if (process.env.APP_ENV === "local") {
    path = `credentials`;
  }

  return path;
};

const getCdkOutputPath = () => {
  let path = `/tmp/cdk.out`;

  if (process.env.APP_ENV === "local") {
    path = "cdk.out";
  }

  return path;
};

const getDefaultWorkdir = () => {
  return process.env.CDK_DEFAULT_WORKDIR;
};

const getCdkStationInputFilePath = () => {
  const cdkOutputPath = getCdkOutputPath();
  return `${cdkOutputPath}/station.input.json`;
};

const getCdkBinFilePath = () => {
  const defaultWorkdir = getDefaultWorkdir();
  return `${defaultWorkdir}/node_modules/.bin/cdk`;
};

const getCdkProfilePluginPath = () => {
  const defaultWorkdir = getDefaultWorkdir();
  let path = `${defaultWorkdir}/cdk-profile-plugin`;

  if (process.env.APP_ENV === "local") {
    path = `../../../../../cdk-plugins/cdk-profile-plugin`;
  }

  return path;
};

const getCdkAppBinPath = () => {
  const defaultWorkdir = getDefaultWorkdir();

  return `${defaultWorkdir}/bin`;
};

const getCdkAppPath = (cdkAppName) => {
  const cdkAppBinPath = getCdkAppBinPath();
  return `${cdkAppBinPath}/${cdkAppName}.js`;
};

const generateAwsProfileConfig = (event) => {
  const config = {
    profileName: event.requestId,
    aws_access_key_id: event.credentials.aws_access_key_id,
    aws_secret_access_key: event.credentials.aws_secret_access_key,
    aws_region: event.credentials.aws_region,
  };

  const awsProfileConfigFilePath = getAwsProfileConfigFilePath(
    config.profileName
  );
  const cdkOutputPath = getCdkOutputPath();

  const awsProfileConfigShellCommand = generateAwsProfileCommandConfig(
    awsProfileConfigFilePath,
    cdkOutputPath,
    config
  );

  shell.exec(awsProfileConfigShellCommand);
};

const generateStationInputFile = (event) => {
  const cdkStationInputFilePath = getCdkStationInputFilePath();
  fs.writeFileSync(cdkStationInputFilePath, JSON.stringify(event));

  return event;
};

module.exports.handler = async (event) => {
  generateAwsProfileConfig(event);
  const stationInput = generateStationInputFile(event);

  let deployment = await Deployment().findFirstById(stationInput.deploymentId);
  let station = await Station().findFirstById(deployment.stationId);
  let stationProfile = await StationProfile().findFirstById(station.profileId);

  const cdkOutputPath = getCdkOutputPath(),
    appPath = getCdkAppPath(stationProfile.properties.cdkAppName);

  if (process.env.APP_ENV === "dev") {
    // Access tmp folder as workdir (AWS Lambda enable '/tmp' to read/write)
    shell.cd("/tmp");
  }

  const cdkProfilePlugin = getCdkProfilePluginPath();

  const cdkBinFilePath = getCdkBinFilePath(),
    cdkDeployCommand = `${cdkBinFilePath} deploy`,
    cdkDeployArgs = `-o ${cdkOutputPath} --app ${appPath} --plugin ${cdkProfilePlugin} --require-approval never`,
    cdkDeployCommandExpression = `${cdkDeployCommand} ${cdkDeployArgs}`;

  deployment = await Deployment().sync(deployment, {
    cdkDeploymentProcessEvent: "PROCESSING",
  });

  const cdkDeploy = shell.exec(cdkDeployCommandExpression, {
    silent: false,
    async: false,
  });

  station = await Station().sync(station, {
    cfStackArn: cdkDeploy.stdout.trim(),
  });

  deployment = await Deployment().sync(deployment, {
    cdkDeployProcessStatus: cdkDeploy.code,
    cdkDeploymentProcessEvent: "TERMINATED",
  });

  return {};
};
