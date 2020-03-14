"use strict";

const AWS = require("aws-sdk");
const { exec, pwd, env } = require("shelljs");
const fs = require("fs");

module.exports.handler = async event => {
  const requestId = event.requestId;
  const credentials = event.credentials;
  const profileName = requestId;

  exec(`
rm -rf /tmp/.aws.${profileName}
mkdir /tmp/.aws.${profileName}
sh -c "cat <<EOF >> /tmp/.aws.${profileName}/config
[profile ${profileName}]
aws_access_key_id=${credentials.aws_access_key_id}
aws_secret_access_key=${credentials.aws_secret_access_key}
region=${credentials.aws_region}
output=json
EOF"
  `);

  // Generate station.input.json
  fs.writeFileSync(
    "/tmp/cdk.out/station.input.json",
    JSON.stringify({
      profileName
    })
  );

  const cdkExec = exec(
    `./node_modules/cdk/bin/cdk deploy -o /tmp/cdk.out --plugin cdk-profile-plugin --require-approval never`,
    { silent: false }
  );

  console.log(event);

  return {};
};
