#!/bin/sh

# INSTANCE_PUBLIC_DNS=$(curl https//169.254.169.254/latest/meta-data/public-hostname)

insertSwarmLeaveClusterScript() {
  sudo sh -c "cat << EOF >> /etc/rc.d/rc0.d/01SWARMleave
  #!/bin/sh

  docker swarm leave --force
  EOF"

  sudo chmod +x /etc/rc.d/rc0.d/01SWARMleave

  sudo ln -s /etc/rc.d/rc0.d/01SWARMleave /etc/rc.d/rc6.d/01SWARMleave
}

insertSwarmLeaveClusterScript

sudo systemctl start rexray

sleep 10

docker plugin enable rexray/ebs:latest
docker plugin enable rexray/s3fs:latest
docker plugin enable rexray/efs:latest