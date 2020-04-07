#!/bin/sh

INSTANCE_PUBLIC_DNS=$(curl http://169.254.169.254/latest/meta-data/public-hostname)

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

sudo docker swarm init --advertise-addr eth0

# Installing Portainer Server and Agent
curl -L https://downloads.portainer.io/portainer-agent-stack.yml -o portainer-agent-stack.yml
docker stack deploy --compose-file=portainer-agent-stack.yml portainer

docker plugin enable rexray/ebs:latest
docker plugin enable rexray/s3fs:latest
docker plugin enable rexray/efs:latest

BEARER_TOKEN=$(curl -X POST localhost:9000/api/auth -d "{\"Username\": \"admin\", \"Password\": \"12345678\"}" | jq -r '.jwt')

curl -v -X PUT localhost:9000/api/endpoints/1 \
    -d "{\"PublicURL\": \"${INSTANCE_PUBLIC_DNS}\"}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $BEARER_TOKEN" | jq . \
    >> output.txt