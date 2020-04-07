const fs = require("fs");
const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const iam = require("@aws-cdk/aws-iam");
const sns = require("@aws-cdk/aws-sns");
const subs = require("@aws-cdk/aws-sns-subscriptions");
const lambda = require("@aws-cdk/aws-lambda");
const autoscaling = require("@aws-cdk/aws-autoscaling");
const { stationInput } = require("../bin/loadStationInput");

class SwarmBasicClusterStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    this.config = {
      vpc: {
        id: "swarmVpc",
        cidr: "10.0.0.0/16",
        maxAzs: 2,
        subnetConfiguration: [
          {
            cidrMask: 26,
            name: "publicSubnet",
            subnetType: ec2.SubnetType.PUBLIC,
          },
        ],
        natGateways: 0,
      },
      swarmNodeSecurityGroup: {
        id: "swarmNodeSecurityGroup",
        groupName: `swarm-node-sg-${id}`,
        groupDescription: "Docker Swarm Node SG",
        securityGroupIngress: [
          {
            ipProtocol: "-1",
            fromPort: 0,
            toPort: 65535,
            cidrIp: "0.0.0.0/0",
          },
        ],
      },
      swarmNodeManagerLaunchTemplate: {
        id: "swarmNodeManagerLaunchTemplate",
        launchTemplateName: `swarm-node-manager-launchtemplate-${id}`,
        launchTemplateData: {
          capacityReservationSpecification: {
            capacityReservationPreference: "open",
          },
          creditSpecification: {
            cpuCredits: "standard",
          },
          disableApiTermination: false,
          ebsOptimized: false,
          imageId: stationInput.defaultAmiId,
          instanceInitiatedShutdownBehavior: "terminate",
          instanceType: "t3a.micro",
          keyName: "wordpress-ops-host-keypair-2020-03-11",
          monitoring: {
            enabled: false,
          },
        },
      },
      swarmManagerSnsTopic: {
        id: "swarmManagerTopic",
        props: {
          displayName: "SwarmManagerTopic",
        },
      },
      swarmManagerLambdaFnSubExecRole: {
        id: "swarmManagerLambdaFnSubExecRole",
        props: {
          assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
          description: "Basic execution role",
        },
      },
      swarmManagerLambdaFnSub: {
        id: "swarmManagerLambdaFnSub",
        props: {
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
        },
      },
      swarmManagerAutoscaling: {
        id: "swarmManagerAutoscaling",
        props: {
          desiredCapacity: "0",
          minSize: "0",
          maxSize: "0",
          tags: [
            {
              key: "Application",
              value: `swarm-node-${id}`,
              propagateAtLaunch: true,
            },
            {
              key: "Environment",
              value: "production",
              propagateAtLaunch: true,
            },
            {
              key: "SwarmRole",
              value: "manager",
              propagateAtLaunch: true,
            },
          ],
        },
      },
    };

    this.swarmVpc = this.createVpc();
    this.swarmNodeSecurityGroup = this.createSwarmNodeSecurityGroup(
      this.swarmVpc.vpcId
    );
    this.swarmNodeManagerEntrypointFileString = this.getSwarmNodeManagerEntrypointFileString();
    this.swarmNodeManagerLaunchTemplate = this.createSwarmNodeLaunchTemplate(
      this.swarmNodeManagerEntrypointFileString,
      this.swarmNodeSecurityGroup
    );

    this.swarmManagerSnsTopic = this.createSwarmManagerSnsTopic();
    this.swarmManagerLambdaFnSubExecRole = this.createSwarmManagerLambdaFnSubExecRole();
    this.swarmManagerLambdaFnSub = this.createSwarmManagerLambdaFnSub(
      this.swarmManagerLambdaFnSubExecRole
    );

    const selection = this.swarmVpc.selectSubnets({
      subnetType: ec2.SubnetType.PUBLIC,
    });

    this.autoscalingSwarmManager = this.createAutoscalingSwarmManager(
      this.swarmNodeManagerLaunchTemplate,
      this.swarmManagerSnsTopic,
      selection
    );
  }

  createVpc = () => {
    return new ec2.Vpc(this, this.config.vpc.id, this.config.vpc);
  };

  createSwarmNodeSecurityGroup = (vpcId) => {
    return new ec2.CfnSecurityGroup(
      this,
      this.config.swarmNodeSecurityGroup.id,
      { ...this.config.swarmNodeSecurityGroup, vpcId }
    );
  };

  getSwarmNodeManagerEntrypointFileString = () => {
    let swarmNodeManagerEntrypointFile = fs.readFileSync(
      `${__dirname}/../swarm-node-manager-entrypoint.sh`
    );

    let swarmNodeManagerEntrypointFileString = swarmNodeManagerEntrypointFile.toString();
    swarmNodeManagerEntrypointFileString = `
      ${swarmNodeManagerEntrypointFileString}

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

    return swarmNodeManagerEntrypointFileString;
  };

  createSwarmNodeLaunchTemplate = (userData, securityGroup) => {
    return new ec2.CfnLaunchTemplate(
      this,
      this.config.swarmNodeManagerLaunchTemplate.id,
      {
        ...this.config.swarmNodeManagerLaunchTemplate,
        userData: cdk.Fn.base64(userData),
        securityGroupIds: [securityGroup.attrGroupId],
      }
    );
  };

  createSwarmManagerSnsTopic = () => {
    return new sns.Topic(
      this,
      this.config.swarmManagerSnsTopic.id,
      this.config.swarmManagerSnsTopic.props
    );
  };

  createSwarmManagerLambdaFnSubExecRole = () => {
    let role = new iam.Role(
      this,
      this.config.swarmManagerLambdaFnSubExecRole.id,
      this.config.swarmManagerLambdaFnSubExecRole.props
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["*"],
        resources: ["*"],
      })
    );

    return role;
  };

  createSwarmManagerLambdaFnSub = (executionRole) => {
    return new lambda.Function(this, this.config.swarmManagerLambdaFnSub.id, {
      ...this.config.swarmManagerLambdaFnSub.props,
      role: executionRole,
    });
  };

  createAutoscalingSwarmManager = (launchTemplate, snsTopic, subnets) => {
    return new autoscaling.CfnAutoScalingGroup(
      this,
      this.config.swarmManagerAutoscaling.id,
      {
        ...this.config.swarmManagerAutoscaling.props,
        launchTemplate: {
          launchTemplateId: launchTemplate.ref,
          version: launchTemplate.attrLatestVersionNumber,
        },
        notificationConfigurations: [
          {
            notificationTypes: [
              "autoscaling:EC2_INSTANCE_LAUNCH",
              "autoscaling:EC2_INSTANCE_LAUNCH_ERROR",
              "autoscaling:EC2_INSTANCE_TERMINATE",
              "autoscaling:EC2_INSTANCE_TERMINATE_ERROR",
            ],
            topicArn: snsTopic.topicArn,
          },
        ],
        vpcZoneIdentifier: subnets.subnetIds,
      }
    );
  };
}

module.exports = { SwarmBasicClusterStack };
