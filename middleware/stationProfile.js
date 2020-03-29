module.exports = app => {
  const StationProfile = app.models.stationProfile;

  this.create = async (req, res, next) => {
    try {
      const stationProfile = await StationProfile.create({
        ...req.body.data.attributes
      });

      return res.status(200).json({
        data: stationProfile
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
