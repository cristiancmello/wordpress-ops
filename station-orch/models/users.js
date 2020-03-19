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

module.exports = User;
