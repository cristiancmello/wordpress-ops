const ec2 = require("@aws-cdk/aws-ec2");
const { SwarmCluster } = require("../SwarmBasicCluster/SwarmCluster");
const { Component } = require("./Component");

class Ec2SecurityGroup extends Component {
  render = () => {
    if (this.parent instanceof SwarmCluster) {
      new ec2.CfnSecurityGroup(this.context, this.id, {
        ...this.props,
        vpcId: this.parent.props.vpc.vpcId,
      });
    } else {
      new ec2.CfnSecurityGroup(this.context, this.id, this.props);
    }

    return this;
  };
}

module.exports = {
  Ec2SecurityGroup,
};
