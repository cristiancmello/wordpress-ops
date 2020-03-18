"use strict";

const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();
const Deployment = require("../models/deployments");
const User = require("../models/users");
const Station = require("../models/stations");
const { DataMapper } = require("@aws/dynamodb-data-mapper");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const { equals } = require("@aws/dynamodb-expressions");

const client = new DynamoDB({ region: "us-east-1" });
const mapper = new DataMapper({ client });

const callCdkDeployLambda = params => {
  return lambda.invokeAsync(params).promise();
};

const startDeployment = async (attributes, relationships) => {
  try {
    const deployment = new Deployment();

    deployment.userId = relationships.user.data.id;
    deployment.stationId = relationships.station.data.id;

    const createDeploymentPromise = mapper.put({ item: deployment });
    return createDeploymentPromise;
  } catch (e) {
    console.log(e);
  }
};

module.exports.handler = async event => {
  try {
    const input = JSON.parse(event.body);
    const inputAttributes = input.data.attributes;
    const inputRelationships = input.data.relationships;
    const requestId = event.requestContext.requestId;

    const user = new User();
    const station = new Station();

    user.id = inputRelationships.user.data.id;
    station.id = inputRelationships.station.data.id;

    const stations = mapper.scan(Station, {
      limit: 1,
      filter: {
        ...equals(station.id),
        subject: "id"
      }
    });

    const firstStation = async stations => {
      for await (const record of stations) {
        return record;
      }
    };

    const foundStation = await firstStation(stations);

    const startedDeployment = await startDeployment(
      inputAttributes,
      inputRelationships
    );

    const params = {
      FunctionName: "station-orch-dev-cdkDeploy",
      InvokeArgs: Buffer.from(
        JSON.stringify({
          requestId,
          processId: startedDeployment.randomString,
          credentials: {
            aws_access_key_id: process.env.OPS_ACCESS_KEY_ID,
            aws_secret_access_key: process.env.OPS_SECRET_ACCESS_KEY,
            aws_region: process.env.OPS_AWS_REGION,
            account: process.env.CDK_DEFAULT_ACCOUNT
          },
          stackName: foundStation.randomString
        })
      )
    };

    const responseCdkDeployPromise = callCdkDeployLambda(params);
    const respondeCdkDeploy = await responseCdkDeployPromise;

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          data: {
            response: respondeCdkDeploy,
            requestId,
            processId: startedDeployment.randomString
          }
        },
        null,
        2
      )
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          errors: []
        },
        null,
        2
      )
    };
  }
};
