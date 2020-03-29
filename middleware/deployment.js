const AWS = require("aws-sdk");
const SSM = new AWS.SSM();

const lambda = new AWS.Lambda({
  endpoint: process.env.LAMBDA_ENDPOINT
});

const callCdkDeployLambda = params => {
  return lambda.invokeAsync(params).promise();
};

module.exports = app => {
  const Deployment = app.models.deployment,
    Station = app.models.station;

  this.create = async (req, res, next) => {
    try {
      const deploymentPromise = Deployment.create(
        req.body.data.attributes,
        req.body.data.relationships
      );

      const stationPromise = Station.findFirstById(
        req.body.data.relationships.station.data.id
      );

      const latestDefaultAmiIdParameterPromise = SSM.getParameter({
        Name: process.env.OPS_DEFAULT_AMI_ID_SSM_PARAMSTORE_NAME,
        WithDecryption: true
      }).promise();

      const requestId = req.requestContext.requestId,
        state = req.body.data.attributes.state;

      const deployment = await deploymentPromise,
        station = await stationPromise,
        latestDefaultAmiIdParameter = await latestDefaultAmiIdParameterPromise;

      const invokeArgs = {
        requestId,
        deploymentId: deployment.id,
        credentials: {
          aws_access_key_id: process.env.OPS_ACCESS_KEY_ID,
          aws_secret_access_key: process.env.OPS_SECRET_ACCESS_KEY,
          aws_region: process.env.OPS_AWS_REGION,
          account: process.env.CDK_DEFAULT_ACCOUNT
        },
        stackName: station.randomString,
        state,
        defaultAmiId: latestDefaultAmiIdParameter.Parameter.Value
      };

      const params = {
        FunctionName: process.env.LAMBDA_FN_CDK_DEPLOY,
        InvokeArgs: Buffer.from(JSON.stringify(invokeArgs))
      };

      const responseCdkDeployPromise = callCdkDeployLambda(params);
      const responseCdkDeploy = await responseCdkDeployPromise;

      return res.status(200).json({
        data: {
          ...deployment,
          ...responseCdkDeploy
        }
      });
    } catch (error) {
      return res.status(400).json({
        errors: [
          {
            detail: error.message
          }
        ]
      });
    }
  };

  return this;
};
