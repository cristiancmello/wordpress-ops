const fs = require("fs");
const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const iam = require("@aws-cdk/aws-iam");
const sns = require("@aws-cdk/aws-sns");
const subs = require("@aws-cdk/aws-sns-subscriptions");
const lambda = require("@aws-cdk/aws-lambda");
const autoscaling = require("@aws-cdk/aws-autoscaling");
const { stationInput } = require("../bin/loadStationInput");

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
      "swarmNodeSecurityGroup",
      {
        groupName: `swarm-node-sg-${id}`,
        groupDescription: "Docker Swarm Node SG",
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

    // Swarm Manager: 1 launchtemplate; 1 asg
    let swarmNodeManagerEntrypointFile = fs.readFileSync(
      `${__dirname}/../swarm-node-manager-entrypoint.sh`
    );

    const swarmNodeManagerLaunchTemplate = new ec2.CfnLaunchTemplate(
      this,
      "swarmNodeManagerLaunchTemplate",
      {
        launchTemplateName: `swarm-node-manager-launchtemplate-${id}`,
        launchTemplateData: {
          capacityReservationSpecification: {
            capacityReservationPreference: "open"
          },
          creditSpecification: {
            cpuCredits: "standard"
          },
          disableApiTermination: false,
          ebsOptimized: false,
          imageId: stationInput.defaultAmiId,
          instanceInitiatedShutdownBehavior: "terminate",
          instanceType: "t3a.nano",
          keyName: "wordpress-ops-host-keypair-2020-03-11",
          monitoring: {
            enabled: false
          },
          securityGroupIds: [securityGroup.attrGroupId],
          userData: cdk.Fn.base64(swarmNodeManagerEntrypointFile.toString()),
          placement: {
            availabilityZone: "us-east-1a"
          }
        }
      }
    );

    let swarmNodeWorkerEntrypointFile = fs.readFileSync(
      `${__dirname}/../swarm-node-worker-entrypoint.sh`
    );

    const swarmNodeWorkerLaunchTemplate = new ec2.CfnLaunchTemplate(
      this,
      "swarmNodeWorkerLaunchTemplate",
      {
        launchTemplateName: `swarm-node-worker-launchtemplate-${id}`,
        launchTemplateData: {
          capacityReservationSpecification: {
            capacityReservationPreference: "open"
          },
          creditSpecification: {
            cpuCredits: "standard"
          },
          disableApiTermination: false,
          ebsOptimized: false,
          imageId: stationInput.defaultAmiId,
          instanceInitiatedShutdownBehavior: "terminate",
          instanceType: "t3a.nano",
          keyName: "wordpress-ops-host-keypair-2020-03-11",
          monitoring: {
            enabled: false
          },
          securityGroupIds: [securityGroup.attrGroupId],
          userData: cdk.Fn.base64(swarmNodeWorkerEntrypointFile.toString()),
          placement: {
            availabilityZone: "us-east-1a"
          }
        }
      }
    );

    const swarmManagerSnsTopic = new sns.Topic(this, "swarmManagerTopic", {
      displayName: "SwarmManagerTopic"
    });

    // const swarmManagerLambdaFnSubExecRole = new iam.CfnRole(
    //   this,
    //   "swarmManagerLambdaFnSubExecRole",
    //   {
    //     assumeRolePolicyDocument: {
    //       Version: "2012-10-17",
    //       Statement: [
    //         {
    //           Effect: "Allow",
    //           Principal: {
    //             Service: "lambda.amazonaws.com"
    //           },
    //           Action: "sts:AssumeRole"
    //         }
    //       ]
    //     },
    //     policies: [
    //       {
    //         policyName: "swarmManagerLambdaFnSubExecRolePolicy",
    //         policyDocument: {
    //           Version: "2012-10-17",
    //           Statement: [
    //             {
    //               Effect: "Allow",
    //               Action: "*",
    //               Resource: "*"
    //             }
    //           ]
    //         }
    //       }
    //     ]
    //   }
    // );

    const swarmManagerLambdaFnSub = new lambda.Function(
      this,
      "swarmManagerLambdaFnSub",
      {
        runtime: lambda.Runtime.NODEJS_12_X,
        code: lambda.Code.fromInline(
          fs
            .readFileSync(
              `${__dirname}/../lambdaTriggers/afterLaunchInstanceStart.js`
            )
            .toString()
        ),
        handler: "index.handler",
        timeout: cdk.Duration.seconds(900),
        memorySize: 1024
        //role: swarmManagerLambdaFnSubExecRole.attrArn
      }
    );

    swarmManagerSnsTopic.addSubscription(
      new subs.LambdaSubscription(swarmManagerLambdaFnSub)
    );

    let hostAction = stationInput.state.action.host;

    let hostAsgInstanceSpecs = {};

    switch (hostAction.name) {
      case "active":
        hostAsgInstanceSpecs = {
          desiredCapacity: "1",
          minSize: "1",
          maxSize: "1"
        };

        break;

      case "inactive":
        hostAsgInstanceSpecs = {
          desiredCapacity: "0",
          minSize: "0",
          maxSize: "0"
        };

        break;
    }

    const autoscalingSwarmManager = new autoscaling.CfnAutoScalingGroup(
      this,
      "swarmManagerAutoscaling",
      {
        ...hostAsgInstanceSpecs,
        launchTemplate: {
          launchTemplateId: swarmNodeManagerLaunchTemplate.ref,
          version: swarmNodeManagerLaunchTemplate.attrLatestVersionNumber
        },
        notificationConfigurations: [
          {
            notificationTypes: [
              "autoscaling:EC2_INSTANCE_LAUNCH",
              "autoscaling:EC2_INSTANCE_LAUNCH_ERROR",
              "autoscaling:EC2_INSTANCE_TERMINATE",
              "autoscaling:EC2_INSTANCE_TERMINATE_ERROR"
            ],
            topicArn: swarmManagerSnsTopic.topicArn
          }
        ],
        availabilityZones: ["us-east-1a"],
        tags: [
          {
            key: "Application",
            value: `swarm-node-${id}`,
            propagateAtLaunch: true
          },
          {
            key: "Environment",
            value: "production",
            propagateAtLaunch: true
          },
          {
            key: "SwarmRole",
            value: "manager",
            propagateAtLaunch: true
          }
        ]
      }
    );

    // const autoscalingSwarmWorker = new autoscaling.CfnAutoScalingGroup(
    //   this,
    //   "swarmWorkerAutoscaling",
    //   {
    //     ...hostAsgInstanceSpecs,
    //     launchTemplate: {
    //       launchTemplateId: swarmNodeWorkerLaunchTemplate.ref,
    //       version: swarmNodeWorkerLaunchTemplate.attrLatestVersionNumber
    //     },
    //     availabilityZones: ["us-east-1a"],
    //     tags: [
    //       {
    //         key: "Application",
    //         value: `swarm-node-${id}`,
    //         propagateAtLaunch: true
    //       },
    //       {
    //         key: "Environment",
    //         value: "production",
    //         propagateAtLaunch: true
    //       },
    //       {
    //         key: "SwarmRole",
    //         value: "worker",
    //         propagateAtLaunch: true
    //       }
    //     ]
    //   }
    // );
  }
}

module.exports = { StationMakerStack };
