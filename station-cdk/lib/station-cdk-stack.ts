import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2'
import * as autoscaling from '@aws-cdk/aws-autoscaling'
import * as fs from 'fs'
import { Fn } from '@aws-cdk/core';

export class StationCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const defaultVpc = ec2.Vpc.fromLookup(this, 'defaultVpc', {
      vpcId: 'vpc-0d6baa74'
    })

    const securityGroup = new ec2.CfnSecurityGroup(this, 'wordpressOpsHostSecurityGroup', {
      groupName: 'wordpress-ops-host-sg',
      groupDescription: 'WordPress Ops Host SG',
      vpcId: defaultVpc.vpcId,
      securityGroupIngress: [
        {
          ipProtocol: 'tcp',
          fromPort: 0,
          toPort: 65535,
          cidrIp: "0.0.0.0/0"
        }
      ]
    })

    let entrypointFile = fs.readFileSync('wordpress-ops-host-entrypoint.sh');

    const wordpressOpsHostLaunchTemplate = new ec2.CfnLaunchTemplate(this, 'wordpressOpsHostLaunchTemplate', {
      launchTemplateName: 'wordpress-ops-host-launchtemplate',
      launchTemplateData: {
        capacityReservationSpecification: {
          capacityReservationPreference: 'open'
        },
        creditSpecification: {
          cpuCredits: 'standard'
        },
        disableApiTermination: false,
        ebsOptimized: false,
        imageId: 'ami-052a7b29b53efb6f6',
        instanceInitiatedShutdownBehavior: 'terminate',
        instanceType: 't2.micro',
        keyName: 'wordpress-ops-host-keypair-2020-03-06',
        monitoring: {
          enabled: false
        },
        securityGroupIds: [securityGroup.attrGroupId],
        userData: Fn.base64(entrypointFile.toString()),
        placement: {
          availabilityZone: 'us-east-1a'
        }
      }
    })

    const autoScalingGroup = new autoscaling.CfnAutoScalingGroup(this, 'wordpressOpsHostAutoscaling', {
      desiredCapacity: '1',
      minSize: '1',
      maxSize: '1',
      launchTemplate: {
        launchTemplateId: wordpressOpsHostLaunchTemplate.ref,
        version: wordpressOpsHostLaunchTemplate.attrLatestVersionNumber
      },
      availabilityZones: ['us-east-1a'],
      tags: [
        {
          key: "Application",
          value: "wordpress-ops-host",
          propagateAtLaunch: true
        },
        {
          key: "Environment",
          value: "production",
          propagateAtLaunch: true
        }
      ]
    })
  }
}
