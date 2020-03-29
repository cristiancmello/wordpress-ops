"use strict";

const AWS = require("aws-sdk");
const autoscaling = new AWS.AutoScaling();
const ec2 = new AWS.EC2();
const cloudformation = new AWS.CloudFormation();

/**
 *
 * @param {Station} station - Station object
 */
const getInstances = async station => {
  const stackResources = await cloudformation
    .listStackResources({
      StackName: station.randomString
    })
    .promise();

  const stackResourcesSummaries = stackResources.StackResourceSummaries;

  const index = stackResourcesSummaries.findIndex(
    resource => resource.ResourceType === "AWS::AutoScaling::AutoScalingGroup"
  );

  const autoScalingResourceSummary = stackResourcesSummaries[index];

  const autoScalingResourceDescription = await autoscaling
    .describeAutoScalingGroups({
      AutoScalingGroupNames: [autoScalingResourceSummary.PhysicalResourceId]
    })
    .promise();

  const firstAutoScalingGroup =
    autoScalingResourceDescription.AutoScalingGroups[0];

  const autoScalingInstances = firstAutoScalingGroup.Instances;

  const instancesDescription = [];

  for (let instance of autoScalingInstances) {
    const descriptions = await ec2
      .describeInstances({
        InstanceIds: [instance.InstanceId]
      })
      .promise();

    const firstReservation = descriptions.Reservations[0];
    const ec2InstancesDescriptions = firstReservation.Instances;

    const ec2InstanceDescIndex = ec2InstancesDescriptions.findIndex(
      i => i.InstanceId === instance.InstanceId
    );

    const ec2InstanceDescription =
      ec2InstancesDescriptions[ec2InstanceDescIndex];

    instance = {
      ...instance,
      ...ec2InstanceDescription
    };

    instancesDescription.push(instance);
  }

  return instancesDescription;
};

/**
 *
 * @param {Station} station - Station object
 */
const getInstancesTransformed = async station => {
  const instances = await getInstances(station);
  const instancesDescription = [];

  for (let instance of instances) {
    instance = {
      PublicDnsName: instance.PublicDnsName,
      PublicIpAddress: instance.PublicIpAddress,
      LifecycleState: instance.LifecycleState,
      HealthStatus: instance.HealthStatus,
      State: instance.State,
      Tags: instance.Tags
    };

    instancesDescription.push(instance);
  }

  return instancesDescription;
};

module.exports = {
  getInstances,
  getInstancesTransformed
};
