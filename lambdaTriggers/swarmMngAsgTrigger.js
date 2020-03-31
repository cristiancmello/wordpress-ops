"use strict";

const AWS = require("aws-sdk");
const SSM = new AWS.SSM({
  region: "us-east-1"
});

module.exports.handler = async event => {
  const snsMessage = JSON.parse(event.Records[0].Sns.Message);
  const instanceId = snsMessage.EC2InstanceId;
  const autoScalingEvent = snsMessage.Event;

  const ssmGetStackNamePromise = SSM.getParameter({
    Name: `/swarmClusters/managers/${instanceId}/stackName`
  }).promise();

  if (autoScalingEvent === "autoscaling:EC2_INSTANCE_TERMINATE") {
    const stackName = (await ssmGetStackNamePromise).Parameter.Value;

    const deleteResult = await SSM.deleteParameters({
      Names: [
        `/swarmClusters/${stackName}/manager/ipv4`,
        `/swarmClusters/${stackName}/manager/jointoken/as/worker`,
        `/swarmClusters/managers/${instanceId}/stackName`
      ]
    }).promise();

    console.log(deleteResult);
  }

  return {};
};
