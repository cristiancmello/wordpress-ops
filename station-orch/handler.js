"use strict";

const AWS = require("aws-sdk");
const { exec, pwd, env } = require("shelljs");

module.exports.deploy = async event => {
  exec(`
    mkdir /tmp/.aws.default_profile
    sh -c "cat << EOF >> /tmp/.aws.default_profile/config
    [default]
    aws_access_key_id=${process.env.ACCESS_KEY_ID}
    aws_secret_access_key=${process.env.SECRET_ACCESS_KEY}
    region=us-east-1
    output=json
    EOF"
  `);

  const cdkExec = exec(
    `./node_modules/cdk/bin/cdk deploy -o /tmp/cdk.out --require-approval never`,
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
