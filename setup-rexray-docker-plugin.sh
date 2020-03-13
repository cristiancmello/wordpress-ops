#!/bin/sh

sudo systemctl restart rexray
sleep 3

docker plugin install rexray/ebs \
    REXRAY_PREEMPT=true \
    EBS_REGION=$EBS_REGION \
    EBS_ACCESSKEY=$EBS_ACCESSKEY \
    EBS_SECRETKEY=$EBS_SECRETKEY \
    --grant-all-permissions

docker plugin install rexray/s3fs \
    S3FS_ACCESSKEY=$EBS_ACCESSKEY \
    S3FS_SECRETKEY=$EBS_SECRETKEY \
    --grant-all-permissions

docker plugin install rexray/efs \
    EFS_ACCESSKEY=$EBS_ACCESSKEY \
    EFS_SECRETKEY=$EBS_SECRETKEY \
    EFS_TAG=rexray \
    --grant-all-permissions
