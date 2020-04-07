const { SwarmCluster } = require("./SwarmCluster");

const SwarmBasicCluster = (context, id, props) => {
  return new SwarmCluster(context, id, props);
};

module.exports = {
  SwarmBasicCluster,
};
