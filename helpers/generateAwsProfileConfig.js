"use strict";

module.exports.generateAwsProfileCommandConfig = (
  awsProfileConfigFilePath,
  cdkOutputPath,
  config
) => {
  return `
    rm -rf ${awsProfileConfigFilePath}
    mkdir ${awsProfileConfigFilePath}
    rm -rf ${cdkOutputPath}
    mkdir ${cdkOutputPath}

sh -c "cat <<EOF >> ${awsProfileConfigFilePath}/config
[profile ${config.profileName}]
aws_access_key_id=${config.aws_access_key_id}
aws_secret_access_key=${config.aws_secret_access_key}
region=${config.aws_region}
output=json
EOF"
  `;
};
