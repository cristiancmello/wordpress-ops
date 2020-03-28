const { InstanceResource } = require("../resources/instances");

module.exports = app => {
  this.getInstances = async (req, res, next) => {
    try {
      const { stationId } = req.params;

      const instances = await InstanceResource.getInstances({
        station: {
          id: stationId
        }
      });

      return res.status(200).json({
        data: instances
      });
    } catch (error) {
      return res.status(400).json({
        errors: [
          {
            detail: error.message
          }
        ]
      });
    }
  };

  return this;
};
