const { DynamoDbSchema, DynamoDbTable } = require("@aws/dynamodb-data-mapper");
const express = require("express");
const app = express();

const { DataMapper } = require("@aws/dynamodb-data-mapper");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const { equals } = require("@aws/dynamodb-expressions");

const client = new DynamoDB({ region: "us-east-1" });
const mapper = new DataMapper({ client });

const uuid = require("uuid");

class User {
  constructor(app) {
    return this;
  }
}

Object.defineProperties(User.prototype, {
  [DynamoDbTable]: {
    value: "users"
  },
  [DynamoDbSchema]: {
    value: {
      id: {
        type: "String",
        defaultProvider: uuid.v4,
        keyType: "HASH"
      },
      email: {
        type: "String"
      },
      name: { type: "String" }
    }
  }
});

/**
 * @param {app} app
 */
module.exports = app => {
  this.create = async attributes => {
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
  };

  return this;
};
