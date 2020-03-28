"use strict";

const { InstanceResource } = require("../resources/instances");

module.exports.handler = async event => {
  const instances = await InstanceResource.getInstances({
    station: {
      id: event.pathParameters.id
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify(instances)
  };
};
