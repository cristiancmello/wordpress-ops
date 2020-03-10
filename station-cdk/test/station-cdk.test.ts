import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import StationCdk = require('../lib/station-cdk-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new StationCdk.StationCdkStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
