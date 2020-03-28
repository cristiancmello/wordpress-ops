module.exports = app => {
  const station = app.middleware.station;

  app.post("/stations", station.create);

  return this;
};
