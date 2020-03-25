"use strict";

const AWS = require("aws-sdk");
const Station = require("../models/stations");
const { DataMapper } = require("@aws/dynamodb-data-mapper");
const DynamoDB = require("aws-sdk/clients/dynamodb");

const client = new DynamoDB({ region: "us-east-1" });
const mapper = new DataMapper({ client });

const createStation = async (attributes, relations) => {
  const station = new Station();

  try {
    station.userId = relations.user.data.id;
    station.profileId = relations.profile.data.id;
    const createStationPromise = mapper.put({ item: station });

    return createStationPromise;
  } catch (e) {
    console.log(e);
  }
};

module.exports.handler = async event => {
  const input = JSON.parse(event.body);
  const inputAttributes = input.data.attributes;
  const inputRelations = input.data.relationships;

  const createdStation = await createStation(inputAttributes, inputRelations);

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        data: createdStation
      },
      null,
      2
    )
  };
};
