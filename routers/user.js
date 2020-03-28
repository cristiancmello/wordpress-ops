module.exports = app => {
  const user = app.middleware.user;

  app.post("/users", user.create);

  return this;
};
