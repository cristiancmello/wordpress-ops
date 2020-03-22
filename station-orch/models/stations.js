const {
  DynamoDbSchema,
  DynamoDbTable,
  embed
} = require("@aws/dynamodb-data-mapper");

const randomstring = require("randomstring");

const uuid = require("uuid");

class Station {
  constructor() {}
}

const randomString = () => {
  return `cfstack-${randomstring.generate(7)}`;
};

Object.defineProperties(Station.prototype, {
  [DynamoDbTable]: {
    value: "stations"
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
      profileId: {
        type: "String"
      },
      randomString: {
        type: "String",
        keyType: "HASH",
        defaultProvider: randomString
      },
      cfStackArn: {
        type: "String"
      }
    }
  }
});

module.exports = Station;
