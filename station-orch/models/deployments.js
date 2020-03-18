const {
  DynamoDbSchema,
  DynamoDbTable,
  embed
} = require("@aws/dynamodb-data-mapper");

const randomstring = require("randomstring");

const uuid = require("uuid");

class Deployment {
  constructor() {}
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
      }
    }
  }
});

module.exports = Deployment;
