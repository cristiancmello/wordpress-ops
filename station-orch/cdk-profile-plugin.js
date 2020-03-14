const { SDK } = require("aws-cdk/lib/api/util/sdk");

module.exports = {
  version: "1",
  name: "cdk-profile-plugin",
  init: host => {
    host.registerCredentialProviderSource({
      canProvideCredentials(accountId) {
        let result = accountId => {
          return accountId;
        };
        return Promise.resolve(result);
      },
      getProvider(accountId, mode) {
        let profile = "myprofile";

        console.log("Using profile", profile, "for", accountId);
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
