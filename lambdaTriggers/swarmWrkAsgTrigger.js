"use strict";

const AWS = require("aws-sdk");
const SSM = new AWS.SSM({
  region: "us-east-1"
});

module.exports.handler = async event => {
  const snsMessage = JSON.parse(event.Records[0].Sns.Message);
  const instanceId = snsMessage.EC2InstanceId;
  const autoScalingEvent = snsMessage.Event;

  console.log("instanceId", instanceId);
  console.log("autoScalingEvent", autoScalingEvent);

  return {};
};
