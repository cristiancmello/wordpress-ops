"use strict";

const Station = require("../models/stations");
const { getInstancesTransformed } = require("../helpers/instances");

class InstanceResource {
  constructor() {}

  static getInstances = async request => {
    const stationId = request.station.id;
    const station = await Station.findFirstById(stationId);

    const instancesDescription = await getInstancesTransformed(station);

    return {
      data: {
        instances: instancesDescription
      }
    };
  };
}

module.exports.InstanceResource = InstanceResource;
