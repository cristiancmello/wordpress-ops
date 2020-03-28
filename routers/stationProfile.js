module.exports = app => {
  const stationProfile = app.middleware.stationProfile;

  app.post("/station-profiles", stationProfile.create);

  return this;
};
