const { Ec2SecurityGroup } = require("../base/Ec2SecurityGroup");

const SecurityGroup = (context, id, props) => {
  return new Ec2SecurityGroup(context, id, props);
};

module.exports = {
  SecurityGroup,
};
