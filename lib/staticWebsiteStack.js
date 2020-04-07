"use strict";

const cdk = require("@aws-cdk/core");
const s3 = require("@aws-cdk/aws-s3");
const cloudfront = require("@aws-cdk/aws-cloudfront");
const randomstring = require("randomstring");
const loadStationInput = require("../bin/loadStationInput");
const AWS = require("aws-sdk");

class StaticWebsiteStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const stationInput = loadStationInput.stationInput;
    const bucketName = loadStationInput.stationInput.stackName.toLocaleLowerCase();

    this.s3Bucket = new s3.CfnBucket(this, "s3Bucket", {
      bucketName: `s3bucket-${bucketName}`,
      websiteConfiguration: {
        indexDocument: "index.html",
        errorDocument: "4xx.html",
      },
    });

    console.log(this.s3Bucket.attrWebsiteUrl);

    // this.staticWebsiteCloudfront = new cloudfront.CfnDistribution(this, "", {
    //   distributionConfig: {
    //     origins: [
    //       {
    //         domainName: cdk.Fn.select(
    //           2,
    //           cdk.Fn.split("/", this.s3Bucket.attrWebsiteUrl)
    //         ),
    //       },
    //     ],
    //   },
    // });

    // this.cloudfront = new cloudfront.CloudFrontWebDistribution(
    //   this,
    //   "cloudfrontStaticWeb",
    //   {
    //     // originConfigs: [
    //     //   {
    //     //     s3OriginSource: {
    //     //       s3BucketSource: this.s3Bucket,
    //     //     },
    //     //     behaviors: [{ isDefaultBehavior: true }],
    //     //   },
    //     // ],
    //     originConfigs: [
    //       {
    //         s3OriginSource: {
    //           s3BucketSource: {
    //             bucketArn: this.s3Bucket.ref,
    //             bucketWebsiteDomainName: "test.cristiancmello.com",
    //           },
    //         },
    //         behaviors: [
    //           {
    //             isDefaultBehavior: true,
    //           },
    //         ],
    //       },
    //     ],
    //   }
    // );
  }
}

module.exports = {
  StaticWebsiteStack,
};
