module.exports = app => {
  const User = app.models.user;

  this.create = async (req, res, next) => {
    try {
      const user = await User.create({
        email: req.body.data.attributes.email,
        name: req.body.data.attributes.name
      });

      return res.status(200).json({
        data: user
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
