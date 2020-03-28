const { expect, matchTemplate, MatchStyle } = require("@aws-cdk/assert");
const cdk = require("@aws-cdk/core");
const StationMaker = require("../lib/station-maker-stack");

test("Empty Stack", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new StationMaker.StationMakerStack(app, "MyTestStack");
  // THEN
  expect(stack).to(
    matchTemplate(
      {
        Resources: {}
      },
      MatchStyle.EXACT
    )
  );
});
