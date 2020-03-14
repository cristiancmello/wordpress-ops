"use strict";

const AWS = require("aws-sdk");
const { exec, pwd, env } = require("shelljs");

module.exports.handler = async event => {
  exec(`
rm -rf /tmp/.aws.default_profile
mkdir /tmp/.aws.default_profile
sh -c "cat <<EOF >> /tmp/.aws.default_profile/config
[profile myprofile]
aws_access_key_id=${process.env.ACCESS_KEY_ID}
aws_secret_access_key=${process.env.SECRET_ACCESS_KEY}
region=us-east-1
output=json
EOF"
  `);

  const cdkExec = exec(
    `./node_modules/cdk/bin/cdk deploy -o /tmp/cdk.out --plugin cdk-profile-plugin --require-approval never`,
    { silent: false }
  );

  console.log(event);

  return {};
};
