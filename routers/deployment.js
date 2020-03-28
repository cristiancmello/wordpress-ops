module.exports = app => {
  const deployment = app.middleware.deployment;

  app.post("/deployments", deployment.create);

  return this;
};
