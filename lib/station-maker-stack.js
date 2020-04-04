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

    let swarmNodeManagerEntrypointFile = fs.readFileSync(
      `${__dirname}/../swarm-node-manager-entrypoint.sh`
    );

    let swarmNodeManagerEntrypointFileString = swarmNodeManagerEntrypointFile.toString();
    swarmNodeManagerEntrypointFileString = `
      ${swarmNodeManagerEntrypointFileString}
      
      sudo docker swarm init --advertise-addr eth0
      DOCKER_SWARM_JOINTOKEN_WORKER=$(docker swarm join-token worker --quiet)
      EC2_INSTANCE_LOCAL_IPV4=$(curl http://169.254.169.254/latest/meta-data/local-ipv4)
      DOCKER_SWARM_MANAGER_INSTANCE_ID=$(curl http://169.254.169.254/latest/meta-data/instance-id)

      export AWS_ACCESS_KEY_ID=${stationInput.credentials.aws_access_key_id}
      export AWS_SECRET_ACCESS_KEY=${stationInput.credentials.aws_secret_access_key}
      export AWS_DEFAULT_REGION=${stationInput.credentials.aws_region}

      aws ssm put-parameter \
        --name "/swarmClusters/${stationInput.stackName}/manager/jointoken/as/worker" \
        --value "$DOCKER_SWARM_JOINTOKEN_WORKER" \
        --type "String" \
        --tier Standard \
        --overwrite

      aws ssm put-parameter \
        --name "/swarmClusters/${stationInput.stackName}/manager/ipv4" \
        --value "$EC2_INSTANCE_LOCAL_IPV4" \
        --type "String" \
        --tier Standard \
        --overwrite

      aws ssm put-parameter \
        --name "/swarmClusters/managers/$DOCKER_SWARM_MANAGER_INSTANCE_ID/stackName" \
        --value "${stationInput.stackName}" \
        --type "String" \
        --tier Standard \
        --overwrite
    `;

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
          instanceType: "t3a.micro",
          keyName: "wordpress-ops-host-keypair-2020-03-11",
          monitoring: {
            enabled: false
          },
          securityGroupIds: [securityGroup.attrGroupId],
          userData: cdk.Fn.base64(swarmNodeManagerEntrypointFileString),
          placement: {
            availabilityZone: "us-east-1a"
          }
        }
      }
    );

    let swarmNodeWorkerEntrypointFile = fs.readFileSync(
      `${__dirname}/../swarm-node-worker-entrypoint.sh`
    );

    let swarmNodeWorkerEntrypointFileString = swarmNodeWorkerEntrypointFile.toString();

    swarmNodeWorkerEntrypointFileString = `
      ${swarmNodeWorkerEntrypointFileString}

      export AWS_ACCESS_KEY_ID=${stationInput.credentials.aws_access_key_id}
      export AWS_SECRET_ACCESS_KEY=${stationInput.credentials.aws_secret_access_key}
      export AWS_DEFAULT_REGION=${stationInput.credentials.aws_region}

      swarm_manager_ready_test() {
        while [ true ]; do
          SWARM_MANAGER_JOINTOKEN_TEST_VALUE=$(aws ssm get-parameter --name "/swarmClusters/${stationInput.stackName}/manager/jointoken/as/worker" | jq -r '.Parameter.Value')
          
          if [ ! -z $SWARM_MANAGER_JOINTOKEN_TEST_VALUE  ]; then
            break
          fi

          echo "Waiting for swarm manager..."
          sleep 1
        done
      }

      swarm_manager_ready_test

      SWARM_MANAGER_JOINTOKEN=$(aws ssm get-parameter --name "/swarmClusters/${stationInput.stackName}/manager/jointoken/as/worker" | jq -r '.Parameter.Value')
      SWARM_MANAGER_LOCALIPV4=$(aws ssm get-parameter --name "/swarmClusters/${stationInput.stackName}/manager/ipv4" | jq -r '.Parameter.Value')

      echo SWARM_MANAGER_JOINTOKEN=$SWARM_MANAGER_JOINTOKEN
      echo SWARM_MANAGER_LOCALIPV4=$SWARM_MANAGER_LOCALIPV4
      docker swarm join --token $SWARM_MANAGER_JOINTOKEN $SWARM_MANAGER_LOCALIPV4:2377
    `;

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
          instanceType: "t3a.micro",
          keyName: "wordpress-ops-host-keypair-2020-03-11",
          monitoring: {
            enabled: false
          },
          securityGroupIds: [securityGroup.attrGroupId],
          userData: cdk.Fn.base64(swarmNodeWorkerEntrypointFileString),
          placement: {
            availabilityZone: "us-east-1a"
          }
        }
      }
    );

    const swarmManagerSnsTopic = new sns.Topic(this, "swarmManagerTopic", {
      displayName: "SwarmManagerTopic"
    });

    const swarmWorkerSnsTopic = new sns.Topic(this, "swarmWorkerTopic", {
      displayName: "SwarmWorkerTopic"
    });

    const swarmManagerLambdaFnSubExecRole = new iam.Role(
      this,
      "swarmManagerLambdaFnSubExecRole",
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        description: "Basic execution role"
      }
    );

    const swarmWorkerLambdaFnSubExecRole = new iam.Role(
      this,
      "swarmWorkerLambdaFnSubExecRole",
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        description: "Basic execution role"
      }
    );

    swarmManagerLambdaFnSubExecRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["*"],
        resources: ["*"]
      })
    );

    swarmWorkerLambdaFnSubExecRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["*"],
        resources: ["*"]
      })
    );

    const swarmManagerLambdaFnSub = new lambda.Function(
      this,
      "swarmManagerLambdaFnSub",
      {
        runtime: lambda.Runtime.NODEJS_12_X,
        code: lambda.Code.fromInline(
          fs
            .readFileSync(
              `${__dirname}/../lambdaTriggers/swarmMngAsgTrigger.js`
            )
            .toString()
        ),
        handler: "index.handler",
        timeout: cdk.Duration.seconds(900),
        memorySize: 1024,
        role: swarmManagerLambdaFnSubExecRole
      }
    );

    const swarmWorkerLambdaFnSub = new lambda.Function(
      this,
      "swarmWorkerLambdaFnSub",
      {
        runtime: lambda.Runtime.NODEJS_12_X,
        code: lambda.Code.fromInline(
          fs
            .readFileSync(
              `${__dirname}/../lambdaTriggers/swarmWrkAsgTrigger.js`
            )
            .toString()
        ),
        handler: "index.handler",
        timeout: cdk.Duration.seconds(900),
        memorySize: 1024,
        role: swarmWorkerLambdaFnSubExecRole
      }
    );

    swarmManagerSnsTopic.addSubscription(
      new subs.LambdaSubscription(swarmManagerLambdaFnSub)
    );

    swarmWorkerSnsTopic.addSubscription(
      new subs.LambdaSubscription(swarmWorkerLambdaFnSub)
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
    //     notificationConfigurations: [
    //       {
    //         notificationTypes: [
    //           "autoscaling:EC2_INSTANCE_LAUNCH",
    //           "autoscaling:EC2_INSTANCE_LAUNCH_ERROR",
    //           "autoscaling:EC2_INSTANCE_TERMINATE",
    //           "autoscaling:EC2_INSTANCE_TERMINATE_ERROR"
    //         ],
    //         topicArn: swarmWorkerSnsTopic.topicArn
    //       }
    //     ],
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
