const {
  DynamoDbSchema,
  DynamoDbTable,
  embed
} = require("@aws/dynamodb-data-mapper");

const randomstring = require("randomstring");

const uuid = require("uuid");

const { DataMapper } = require("@aws/dynamodb-data-mapper");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const { equals } = require("@aws/dynamodb-expressions");

const client = new DynamoDB({ region: "us-east-1" });
const mapper = new DataMapper({ client });

class Station {
  constructor() {}

  static findFirstById = async id => {
    const station = new this();

    station.id = id;

    const stations = mapper.scan(this, {
      limit: 1,
      filter: {
        ...equals(station.id),
        subject: "id"
      }
    });

    const firstStation = async stations => {
      for await (const record of stations) {
        return record;
      }
    };

    return firstStation(stations);
  };
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
