"use strict";

const AWS = require("aws-sdk");
const { exec, pwd } = require("shelljs");

module.exports.deploy = async event => {
  // const child = exec(
  //   "./node_modules/cdk/bin/cdk deploy --require-approval never",
  //   {
  //     silent: true,
  //     async: true
  //   }
  // );

  // child.stdout.on("data", function(data) {
  //   console.log(data);
  // });

  // child.stderr.on("data", data => {
  //   console.log(data);
  // });

  const cdkExec = exec(
    "./node_modules/cdk/bin/cdk deploy -o /tmp/cdk.out --require-approval never",
    { silent: true }
  );

  console.log({
    SECRET_KEY: process.env.SECRET_KEY
  });

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
