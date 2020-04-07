const ec2 = require("@aws-cdk/aws-ec2");
const { Component } = require("../base/Component");

class Ec2Vpc extends Component {
  render = () => {
    return new ec2.Vpc(this.context, this.id, this.props);
  };
}

module.exports = {
  Ec2Vpc,
};
