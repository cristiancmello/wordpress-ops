#!/bin/sh

sudo curl -sSL https://rexray.io/install | sh -s -- stable

sudo sh -c "cat << EOF >> /etc/rexray/config.yml
libstorage:
  service: ebs
  server:
    services:
      ebs:
        driver: ebs
      s3fs:
        driver: s3fs
ebs:
  accessKey: $EBS_ACCESSKEY
  secretKey: $EBS_SECRETKEY
  region: $EBS_REGION

s3fs:
  region:           $EBS_REGION
  accessKey:        $EBS_ACCESSKEY
  secretKey:        $EBS_SECRETKEY
  disablePathStyle: false
EOF"

# Verify env vars...
sudo cat /etc/rexray/config.yml

sudo systemctl start rexray