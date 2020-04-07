"use strict";

const { Component } = require("../base/Component");
const { Ec2Vpc } = require("../base/Ec2Vpc");

class SwarmCluster extends Component {
  constructor(context, id, props, events) {
    events = {
      beforeRenderProps: (self) => {
        if (!(self.props.vpc instanceof Ec2Vpc)) {
          throw new Error("Invalid VPC");
        }
      },
    };

    super(context, id, props, events);
  }
}

module.exports = {
  SwarmCluster,
};
