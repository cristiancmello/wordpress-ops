"use strict";

const AWS = require("aws-sdk");
const { exec, pwd, env } = require("shelljs");
const fs = require("fs");

module.exports.handler = async event => {
  const requestId = event.requestId;
  const credentials = event.credentials;
  const profileName = requestId;
  const account = credentials.account;
  const aws_region = credentials.aws_region;
  const aws_access_key_id = credentials.aws_access_key_id;
  const aws_secret_access_key = credentials.aws_secret_access_key;
  const stackName = event.stackName;

  exec(`
rm -rf /tmp/.aws.${profileName}
rm -rf /tmp/cdk.out
mkdir /tmp/.aws.${profileName}
mkdir /tmp/cdk.out
sh -c "cat <<EOF >> /tmp/.aws.${profileName}/config
[profile ${profileName}]
aws_access_key_id=${aws_access_key_id}
aws_secret_access_key=${aws_secret_access_key}
region=${aws_region}
output=json
EOF"
  `);

  // Generate station.input.json
  fs.writeFileSync(
    "/tmp/cdk.out/station.input.json",
    JSON.stringify({
      profileName,
      requestId,
      account,
      aws_region,
      stackName
    })
  );

  const cdkExec = exec(
    `./node_modules/cdk/bin/cdk deploy -o /tmp/cdk.out --plugin cdk-profile-plugin --require-approval never`,
    { async: true }
  );

  cdkExec.stdout.on("data", function(data) {
    console.log(data);
  });

  cdkExec.stderr.on("data", function(data) {
    console.log(data);
  });

  return {};
};
