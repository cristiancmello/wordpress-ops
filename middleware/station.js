module.exports = app => {
  const Station = app.models.station;

  this.create = async (req, res, next) => {
    try {
      const station = await Station.create(
        req.body.data.attributes,
        req.body.data.relationships
      );

      return res.status(200).json({
        data: station
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
