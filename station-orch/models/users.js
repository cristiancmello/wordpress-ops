const {
  DynamoDbSchema,
  DynamoDbTable,
  embed
} = require("@aws/dynamodb-data-mapper");

const uuid = require("uuid");

class User {
  constructor() {}
}

Object.defineProperties(User.prototype, {
  [DynamoDbTable]: {
    value: "users"
  },
  [DynamoDbSchema]: {
    value: {
      id: { type: "String", defaultProvider: uuid.v4 },
      email: {
        type: "String",
        keyType: "HASH"
      },
      name: { type: "String" }
    }
  }
});

module.exports = User;
