"use strict";

const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();

const callCdkDeployLambda = params => {
  return lambda.invokeAsync(params).promise();
};

module.exports.handler = async event => {
  const requestId = event.requestContext.requestId;

  const params = {
    FunctionName: "station-orch-dev-cdkDeploy",
    InvokeArgs: Buffer.from(
      JSON.stringify({
        requestId
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
          requestId
        }
      },
      null,
      2
    )
  };
};
