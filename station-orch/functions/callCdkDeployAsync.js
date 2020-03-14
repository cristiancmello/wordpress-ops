"use strict";

const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();
const randomstring = require("randomstring");

const callCdkDeployLambda = params => {
  return lambda.invokeAsync(params).promise();
};

module.exports.handler = async event => {
  const requestId = event.requestContext.requestId;
  const processId = randomstring.generate(7);

  const params = {
    FunctionName: "station-orch-dev-cdkDeploy",
    InvokeArgs: Buffer.from(
      JSON.stringify({
        requestId,
        processId,
        credentials: {
          aws_access_key_id: process.env.OPS_ACCESS_KEY_ID,
          aws_secret_access_key: process.env.OPS_SECRET_ACCESS_KEY,
          aws_region: process.env.OPS_AWS_REGION,
          account: process.env.CDK_DEFAULT_ACCOUNT
        },
        stackName: process.env.CDK_DEFAULT_STACK_NAME
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
          processId
        }
      },
      null,
      2
    )
  };
};
