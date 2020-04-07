"use strict";

const { Component } = require("./Component");

class DefaultEntrypointFile extends Component {
  render = () => {
    return this.props;
  };
}

module.exports = {
  DefaultEntrypointFile,
};
