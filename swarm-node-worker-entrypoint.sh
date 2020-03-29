#!/bin/sh

sudo yum install jq -y

INSTANCE_PUBLIC_DNS=$(curl http://169.254.169.254/latest/meta-data/public-hostname)

sudo systemctl start rexray

docker run -d -p 9000:9000 -p 8000:8000 \
  --name portainer \
  --restart always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data portainer/portainer \
  --admin-password '$2y$12$hvIvGRvuzlXnHgeovBVJsOC.o5I7uICedY13P8gvI3VAQ7XvpdYWi' \
  -H unix:///var/run/docker.sock

sleep 10

docker plugin enable rexray/ebs:latest
docker plugin enable rexray/s3fs:latest
docker plugin enable rexray/efs:latest

BEARER_TOKEN=$(curl -X POST localhost:9000/api/auth -d "{\"Username\": \"admin\", \"Password\": \"12345678\"}" | jq -r '.jwt')

curl -v -X PUT localhost:9000/api/endpoints/1 \
    -d "{\"PublicURL\": \"${INSTANCE_PUBLIC_DNS}\"}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $BEARER_TOKEN" | jq . \
    >> output.txt