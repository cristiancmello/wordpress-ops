"use strict";

const AWS = require("aws-sdk");
const cloudformation = new AWS.CloudFormation({ apiVersion: "2010-05-15" });

module.exports.createHost = async event => {
  let params = {};

  const response = await cloudformation.listStacks(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v1.0! Your function executed successfully!",
        input: {
          response
        }
      },
      null,
      2
    )
  };
};
