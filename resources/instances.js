"use strict";

const Station = require("../models/station");
const { getInstancesTransformed } = require("../helpers/instances");

class InstanceResource {
  constructor() {}

  static getInstances = async request => {
    const stationId = request.station.id;
    const station = await Station().findFirstById(stationId);

    const instancesDescription = getInstancesTransformed(station);
    return instancesDescription;
  };
}

module.exports.InstanceResource = InstanceResource;
