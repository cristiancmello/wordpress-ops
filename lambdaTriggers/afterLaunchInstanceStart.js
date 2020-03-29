"use strict";

module.exports.handler = async event => {
  const snsMessage = JSON.parse(event.Records[0].Sns.Message);
  const instanceId = snsMessage.EC2InstanceId;
  const autoScalingEvent = snsMessage.Event;

  console.log("instanceId:", instanceId);
  console.log("event", autoScalingEvent);

  return {};
};
