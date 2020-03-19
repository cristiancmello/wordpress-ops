"use strict";

const AWS = require("aws-sdk");
const User = require("../models/users");
const { DataMapper } = require("@aws/dynamodb-data-mapper");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const { equals } = require("@aws/dynamodb-expressions");

const client = new DynamoDB({ region: "us-east-1" });
const mapper = new DataMapper({ client });

const createUser = async (attributes, relations) => {
  try {
    const user = new User();

    user.email = attributes.email;
    user.name = attributes.name;

    const users = mapper.scan(User, {
      limit: 1,
      filter: {
        ...equals(user.email),
        subject: "email"
      }
    });

    for await (const record of users) {
      if (record) {
        throw new Error("User already created.");
      }
    }

    const createUserPromise = mapper.put({ item: user });
    return createUserPromise;
  } catch (e) {
    throw new Error(e.message);
  }
};

module.exports.handler = async event => {
  try {
    const input = JSON.parse(event.body);
    const inputAttributes = input.data.attributes;

    const createdUser = await createUser(inputAttributes);

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
