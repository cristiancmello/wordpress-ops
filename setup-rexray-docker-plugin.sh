#!/bin/sh

sudo systemctl restart rexray
sleep 3

sudo systemctl status rexray

docker plugin install rexray/ebs \
    REXRAY_PREEMPT=true \
    EBS_REGION=$EBS_REGION \
    EBS_ACCESSKEY=$EBS_ACCESSKEY \
    EBS_SECRETKEY=$EBS_SECRETKEY \
    --grant-all-permissions