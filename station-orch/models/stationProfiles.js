const {
  DynamoDbSchema,
  DynamoDbTable,
  embed
} = require("@aws/dynamodb-data-mapper");

const uuid = require("uuid");

class StationProfile {
  constructor() {}
}

Object.defineProperties(StationProfile.prototype, {
  [DynamoDbTable]: {
    value: "stationProfiles"
  },
  [DynamoDbSchema]: {
    value: {
      id: {
        type: "String",
        keyType: "HASH",
        defaultProvider: uuid.v4
      },
      version: {
        type: "String"
      },
      publicName: {
        type: "String"
      },
      privateName: {
        type: "String"
      },
      privateDescription: {
        type: "String"
      },
      state: {
        type: "String"
      }
    }
  }
});

module.exports = StationProfile;
