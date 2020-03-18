"use strict";

const AWS = require("aws-sdk");
const User = require("../models/users");
const { DataMapper } = require("@aws/dynamodb-data-mapper");
const DynamoDB = require("aws-sdk/clients/dynamodb");

const client = new DynamoDB({ region: "us-east-1" });
const mapper = new DataMapper({ client });

const createUser = async (attributes, relations) => {
  const user = new User();

  try {
    user.email = attributes.email;

    const fetchedUser = await mapper.get({ item: user });

    return null;
  } catch (e) {
    if (e.name === "ItemNotFoundException") {
      user.name = attributes.name;

      const createUserPromise = mapper.put({ item: user });
      return createUserPromise;
    }
  }
};

module.exports.handler = async event => {
  const input = JSON.parse(event.body);
  const inputAttributes = input.data.attributes;

  const createdUser = await createUser(inputAttributes);

  if (createdUser == null) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        errors: [
          {
            detail: `User already created.`
          }
        ]
      })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        data: createdUser
      },
      null,
      2
    )
  };
};
