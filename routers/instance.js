module.exports = app => {
  const instance = app.middleware.instance;

  app.get("/stations/:stationId/instances", instance.getInstances);

  return this;
};
