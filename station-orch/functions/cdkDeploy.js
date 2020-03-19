"use strict";

const fs = require("fs");
const shell = require("shelljs");

const AWS = require("aws-sdk");

const { DataMapper } = require("@aws/dynamodb-data-mapper");
const { equals } = require("@aws/dynamodb-expressions");

const DynamoDB = require("aws-sdk/clients/dynamodb");
const Deployment = require("../models/deployments");
const Station = require("../models/stations");

const client = new DynamoDB({ region: "us-east-1" });
const mapper = new DataMapper({ client });

const getAwsProfileConfigFilePath = profileName => {
  return `/tmp/.aws.${profileName}`;
};

const getCdkOutputPath = () => {
  return `/tmp/cdk.out`;
};

const getCdkStationInputFilePath = () => {
  const cdkOutputPath = getCdkOutputPath();
  return `${cdkOutputPath}/station.input.json`;
};

const getCdkBinFilePath = () => {
  return `./node_modules/cdk/bin/cdk`;
};

const generateAwsProfileConfig = (
  profileName,
  aws_access_key_id,
  aws_secret_access_key,
  aws_region
) => {
  const awsProfileConfigFilePath = getAwsProfileConfigFilePath(profileName);
  const cdkOutputPath = getCdkOutputPath();

  exec(`
rm -rf ${awsProfileConfigFilePath}
mkdir ${awsProfileConfigFilePath}
rm -rf ${cdkOutputPath}
mkdir ${cdkOutputPath}

sh -c "cat <<EOF >> ${awsProfileConfigFilePath}/config
[profile ${profileName}]
aws_access_key_id=${aws_access_key_id}
aws_secret_access_key=${aws_secret_access_key}
region=${aws_region}
output=json
EOF"
  `);
};

const generateStationInputFile = (
  deploymentId,
  requestId,
  account,
  aws_region,
  stackName
) => {
  const cdkStationInputFilePath = getCdkStationInputFilePath();

  fs.writeFileSync(
    cdkStationInputFilePath,
    JSON.stringify({
      deploymentId,
      requestId,
      account,
      aws_region,
      stackName
    })
  );
};

const findFirstDeploymentById = async id => {
  const deployments = mapper.scan(Deployment, {
    limit: 1,
    filter: {
      ...equals(id),
      subject: "id"
    }
  });

  const getfirstDeployment = async deployments => {
    for await (const deployment of deployments) {
      return deployment;
    }
  };

  const deployment = getfirstDeployment(deployments);
  return deployment;
};

const findFirstStationById = async id => {
  const stations = mapper.scan(Station, {
    limit: 1,
    filter: {
      ...equals(id),
      subject: "id"
    }
  });

  const getfirstStation = async stations => {
    for await (const station of stations) {
      return station;
    }
  };

  const station = getfirstStation(stations);
  return station;
};

const syncDeployment = async (deployment, attrs) => {
  let syncDeployment = Object.assign(deployment, attrs);

  const syncDeploymentPromise = mapper.put({ item: syncDeployment });
  return syncDeploymentPromise;
};

const syncStation = async (station, attrs) => {
  let syncStation = Object.assign(station, attrs);

  const syncStationPromise = mapper.put({ item: syncStation });
  return syncStationPromise;
};

module.exports.handler = async event => {
  const { deploymentId, requestId, credentials, stackName } = event;
  const {
    account,
    aws_region,
    aws_access_key_id,
    aws_secret_access_key
  } = credentials;

  generateAwsProfileConfig(
    requestId,
    aws_access_key_id,
    aws_secret_access_key,
    aws_region
  );

  generateStationInputFile(
    deploymentId,
    requestId,
    account,
    aws_region,
    stackName
  );

  let deployment = await findFirstDeploymentById(deploymentId);
  let station = await findFirstStationById(deployment.stationId);

  const cdkOutputPath = getCdkOutputPath();

  shell.ls();
  shell.pwd();
  shell.cd("/tmp");
  shell.pwd();

  // ~/workspaces/wordpress-ops/station-maker/node_modules/cdk/bin/cdk deploy --app ~/workspaces/wordpress-ops/station-maker/bin/station-maker.js

  // const cdkBinFilePath = getCdkBinFilePath(),
  //   cdkDeployCommand = `${cdkBinFilePath} deploy`,
  //   cdkDeployArgs = `-o ${cdkOutputPath} --plugin ../../../cdk-profile-plugin --require-approval never`,
  //   cdkDeployCommandExpression = `${cdkDeployCommand} ${cdkDeployArgs}`;

  // deployment = await syncDeployment(deployment, {
  //   cdkDeploymentProcessEvent: "PROCESSING"
  // });

  // const cdkDeploy = exec(cdkDeployCommandExpression, {
  //   silent: false,
  //   async: false
  // });

  // station = await syncStation(station, {
  //   cfStackArn: cdkDeploy.stdout.trim()
  // });

  // deployment = await syncDeployment(deployment, {
  //   cdkDeployProcessStatus: cdkDeploy.code,
  //   cdkDeploymentProcessEvent: "TERMINATED"
  // });

  return {};
};
