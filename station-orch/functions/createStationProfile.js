"use strict";

const AWS = require("aws-sdk");
const StationProfile = require("../models/stationProfiles");
const { DataMapper } = require("@aws/dynamodb-data-mapper");
const DynamoDB = require("aws-sdk/clients/dynamodb");

const client = new DynamoDB({ region: "us-east-1" });
const mapper = new DataMapper({ client });

const createStationProfile = async (attributes, relations) => {
  try {
    const stationProfile = new StationProfile();

    stationProfile.publicName = attributes.publicName;
    stationProfile.privateName = attributes.privateName;
    stationProfile.publicDescription = attributes.publicDescription;
    stationProfile.privateDescription = attributes.privateDescription;
    stationProfile.properties = JSON.stringify(attributes.properties);

    const createStationProfilePromise = mapper.put({ item: stationProfile });
    return createStationProfilePromise;
  } catch (e) {
    throw new Error(e.message);
  }
};

module.exports.handler = async event => {
  try {
    const input = JSON.parse(event.body);
    const inputAttributes = input.data.attributes;
    const inputRelations = input.data.relationships;

    const createdStationProfile = await createStationProfile(
      inputAttributes,
      inputRelations
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: createdStationProfile
      })
    };
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        errors: [
          {
            detail: e.message
          }
        ]
      })
    };
  }
};
