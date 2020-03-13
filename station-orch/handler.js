"use strict";

const AWS = require("aws-sdk");
const { exec, pwd, env } = require("shelljs");

module.exports.deploy = async event => {
  exec(`export AWS_ACCESS_KEY_ID=${process.env.ACCESS_KEY_ID}`);
  exec(`export AWS_SECRET_ACCESS_KEY=${process.env.SECRET_ACCESS_KEY}`);
  exec(`export AWS_DEFAULT_REGION=us-east-1`);
  // exec(`export CDK_DEFAULT_ACCOUNT=${process.env.CDK_DEFAULT_ACCOUNT}`);
  // exec(`export CDK_DEFAULT_REGION=${process.env.CDK_DEFAULT_REGION}`);

  const cdkExec = exec(
    "./node_modules/cdk/bin/cdk deploy -o /tmp/cdk.out --require-approval never",
    { silent: false }
  );

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v1.0! Your function executed successfully!",
        input: {
          output: `${cdkExec.stdout}`,
          error: `${cdkExec.stderr}`
        }
      },
      null,
      2
    )
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
