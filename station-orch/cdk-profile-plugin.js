const { SDK } = require("aws-cdk/lib/api/util/sdk");
const fs = require("fs");

module.exports = {
  version: "1",
  name: "cdk-profile-plugin",
  init: host => {
    const stationInput = JSON.parse(
      fs.readFileSync("/tmp/cdk.out/station.input.json").toString()
    );

    host.registerCredentialProviderSource({
      canProvideCredentials(accountId) {
        let result = accountId => {
          return accountId;
        };
        return Promise.resolve(result);
      },
      getProvider(accountId, mode) {
        let profile = stationInput.profileName;
        let awsProvider = new SDK({
          profile
        }).credentialsCache.defaultCredentialProvider;
        return Promise.resolve(awsProvider);
      },
      isAvailable() {
        return Promise.resolve(true);
      }
    });
  }
};
