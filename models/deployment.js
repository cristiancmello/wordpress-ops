const { DynamoDbSchema, DynamoDbTable } = require("@aws/dynamodb-data-mapper");

const { DataMapper } = require("@aws/dynamodb-data-mapper");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const { equals } = require("@aws/dynamodb-expressions");

const client = new DynamoDB({ region: "us-east-1" });
const mapper = new DataMapper({ client });

const uuid = require("uuid");

class Deployment {
  constructor() {}

  static findFirstById = async id => {
    const deployments = mapper.scan(this, {
      limit: 1,
      filter: {
        ...equals(id),
        subject: "id"
      }
    });

    const getfirstDeployment = async deployments => {
      for await (const deployment of deployments) {
        return deployment;
      }
    };

    const deployment = getfirstDeployment(deployments);
    return deployment;
  };
}

Object.defineProperties(Deployment.prototype, {
  [DynamoDbTable]: {
    value: "deployments"
  },
  [DynamoDbSchema]: {
    value: {
      id: {
        type: "String",
        defaultProvider: uuid.v4
      },
      userId: {
        type: "String",
        keyType: "HASH"
      },
      stationId: {
        type: "String",
        keyType: "HASH"
      },
      cdkDeployProcessStatus: {
        type: "String"
      },
      cdkDeploymentProcessEvent: {
        type: "String"
      },
      state: {
        type: "String"
      }
    }
  }
});

/**
 * @param {app} app
 */
module.exports = app => {
  const deployment = new Deployment();

  this.create = async (attributes, relations) => {
    deployment.userId = relations.user.data.id;
    deployment.stationId = relations.station.data.id;
    deployment.state = JSON.stringify(attributes.state);

    const createDeploymentPromise = mapper.put({ item: deployment });
    return createDeploymentPromise;
  };

  this.findFirstById = async id => {
    return Deployment.findFirstById(id);
  };

  this.sync = async (deployment, attrs) => {
    let syncDeployment = Object.assign(deployment, attrs);

    const syncDeploymentPromise = mapper.put({ item: syncDeployment });
    return syncDeploymentPromise;
  };

  return this;
};
