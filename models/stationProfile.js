const {
  DynamoDbSchema,
  DynamoDbTable,
  embed,
} = require("@aws/dynamodb-data-mapper");

const express = require("express");
const app = express();

const { DataMapper } = require("@aws/dynamodb-data-mapper");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const { equals } = require("@aws/dynamodb-expressions");

const client = new DynamoDB({ region: "us-east-1" });
const mapper = new DataMapper({ client });

const uuid = require("uuid");

class StationProfile {
  constructor() {}

  static findFirstById = async (id) => {
    const stationProfiles = mapper.scan(this, {
      limit: 1,
      filter: {
        ...equals(id),
        subject: "id",
      },
    });

    const getfirstStationProfile = async (stationProfiles) => {
      for await (const stationProfile of stationProfiles) {
        return stationProfile;
      }
    };

    const stationProfile = getfirstStationProfile(stationProfiles);
    return stationProfile;
  };
}

Object.defineProperties(StationProfile.prototype, {
  [DynamoDbTable]: {
    value: "stationProfiles",
  },
  [DynamoDbSchema]: {
    value: {
      id: {
        type: "String",
        keyType: "HASH",
        defaultProvider: uuid.v4,
      },
      version: {
        type: "String",
      },
      publicName: {
        type: "String",
      },
      privateName: {
        type: "String",
      },
      privateDescription: {
        type: "String",
      },
      state: {
        type: "String",
      },
      properties: {
        type: "String",
      },
    },
  },
});

/**
 * @param {app} app
 */
module.exports = (app) => {
  const stationProfile = new StationProfile();

  this.create = async (attributes) => {
    stationProfile.publicName = attributes.publicName;
    stationProfile.privateName = attributes.privateName;
    stationProfile.publicDescription = attributes.publicDescription;
    stationProfile.privateDescription = attributes.privateDescription;
    stationProfile.state = JSON.stringify(attributes.state);
    stationProfile.properties = JSON.stringify(attributes.properties);

    const createStationProfilePromise = mapper.put({ item: stationProfile });
    return createStationProfilePromise;
  };

  this.findFirstById = async (id) => {
    const firstStationProfile = await StationProfile.findFirstById(id);

    firstStationProfile.properties = JSON.parse(firstStationProfile.properties);

    return firstStationProfile;
  };

  return this;
};
