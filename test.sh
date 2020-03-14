#!/bin/bash

PORTAINER_ADMIN_USERNAME=admin
PORTAINER_ADMIN_PASSWORD=12345678
PORTAINER_HOST=ec2-3-87-247-77.compute-1.amazonaws.com

BEARER_TOKEN=$(http POST $PORTAINER_HOST:9000/api/auth Username="$PORTAINER_ADMIN_USERNAME" Password="$PORTAINER_ADMIN_PASSWORD" | jq -r '.jwt')

# http --form POST $PORTAINER_HOST:9000/api/endpoints \
#     "Authorization: Bearer $BEARER_TOKEN" \
#     Name="test-local" EndpointType=1

# http GET $PORTAINER_HOST:9000/api/templates "Authorization: Bearer $BEARER_TOKEN"

SWARM_ID=$(http GET $PORTAINER_HOST:9000/api/endpoints/1/docker/swarm "Authorization: Bearer $BEARER_TOKEN" | jq -r '.ID')

# Get Endpoints
# http GET $PORTAINER_HOST:9000/api/endpoints \
#     "Authorization: Bearer $BEARER_TOKEN"

http PUT $PORTAINER_HOST:9000/api/endpoints/1 \
    "Authorization: Bearer $BEARER_TOKEN" \
    PublicURL="$PORTAINER_HOST"

# Deploy Stack
# http POST "$PORTAINER_HOST:9000/api/stacks?method=repository&type=1&endpointId=1" \
#     "Authorization: Bearer $BEARER_TOKEN" \
#     Name="cockroachdb-test-1" \
#     SwarmID="$SWARM_ID" \
#     RepositoryURL="https://github.com/portainer/templates" \
#     ComposeFilePathInRepository="stacks/cockroachdb/docker-stack.yml"

# http GET $PORTAINER_HOST:9000/api/endpoints/1/docker/images/search \
#     "Authorization: Bearer $BEARER_TOKEN" \
#     term=="nginx"

# http://192.168.1.21:9000/api/endpoints/1/docker/images/create?fromImage=nginx:alpine
# http://192.168.1.21:9000/api/endpoints/1/docker/containers/create

# Pull image
# DOCKER_IMAGE=nginx:alpine
# http POST "$PORTAINER_HOST:9000/api/endpoints/1/docker/images/create?fromImage=$DOCKER_IMAGE" \
#     "Authorization: Bearer $BEARER_TOKEN"

# # Create Container
# http POST $PORTAINER_HOST:9000/api/endpoints/1/docker/containers/create \
#     "Authorization: Bearer $BEARER_TOKEN" \
#     Name="web01" Image="nginx:alpine" \
#     ExposedPorts:='{ "80/tcp": {} }' \
#     HostConfig:='{ "PortBindings": { "80/tcp": [{ "HostPort": "8080" }] } }'