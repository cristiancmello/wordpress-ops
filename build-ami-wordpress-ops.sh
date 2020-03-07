#!/bin/sh

./packer build \
    -var "aws_access_key=$AWS_ACCESS_KEY_ID" \
    -var "aws_secret_key=$AWS_SECRET_ACCESS_KEY" \
    -var "rexray_service=$REXRAY_SERVICE" \
    -var "ebs_region=$EBS_REGION" \
    -var "ebs_accesskey=$EBS_ACCESSKEY" \
    -var "ebs_secretkey=$EBS_SECRETKEY" \
    ami-wordpress-ops-1.0.0.json