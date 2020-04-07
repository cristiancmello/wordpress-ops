const { Ec2Vpc } = require("../base/Ec2Vpc");

const Vpc = (context, id, props) => {
  return new Ec2Vpc(context, id, props);
};

module.exports = {
  Vpc,
};
