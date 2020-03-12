const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const autoscaling = require("@aws-cdk/aws-autoscaling");
const fs = require("fs");

class StationMakerStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const defaultVpc = ec2.Vpc.fromLookup(this, "defaultVpc", {
      vpcId: "vpc-6a2c0210"
    });

    const securityGroup = new ec2.CfnSecurityGroup(
      this,
      "wordpressOpsHostSecurityGroup",
      {
        groupName: "wordpress-ops-host-sg",
        groupDescription: "WordPress Ops Host SG",
        vpcId: defaultVpc.vpcId,
        securityGroupIngress: [
          {
            ipProtocol: "tcp",
            fromPort: 0,
            toPort: 65535,
            cidrIp: "0.0.0.0/0"
          }
        ]
      }
    );

    let entrypointFile = fs.readFileSync("wordpress-ops-host-entrypoint.sh");

    const wordpressOpsHostLaunchTemplate = new ec2.CfnLaunchTemplate(
      this,
      "wordpressOpsHostLaunchTemplate",
      {
        launchTemplateName: "wordpress-ops-host-launchtemplate",
        launchTemplateData: {
          capacityReservationSpecification: {
            capacityReservationPreference: "open"
          },
          creditSpecification: {
            cpuCredits: "standard"
          },
          disableApiTermination: false,
          ebsOptimized: false,
          imageId: "ami-0561872c553236c1a",
          instanceInitiatedShutdownBehavior: "terminate",
          instanceType: "t2.micro",
          keyName: "wordpress-ops-host-keypair-2020-03-11",
          monitoring: {
            enabled: false
          },
          securityGroupIds: [securityGroup.attrGroupId],
          userData: cdk.Fn.base64(entrypointFile.toString()),
          placement: {
            availabilityZone: "us-east-1a"
          }
        }
      }
    );

    const autoScalingGroup = new autoscaling.CfnAutoScalingGroup(
      this,
      "wordpressOpsHostAutoscaling",
      {
        desiredCapacity: "1",
        minSize: "1",
        maxSize: "1",
        launchTemplate: {
          launchTemplateId: wordpressOpsHostLaunchTemplate.ref,
          version: wordpressOpsHostLaunchTemplate.attrLatestVersionNumber
        },
        availabilityZones: ["us-east-1a"],
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
      }
    );
  }
}

module.exports = { StationMakerStack };
