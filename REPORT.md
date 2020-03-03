# Steps

## Infra Schema

```yml
Node Master:
    Content: docker swarm manager, portainer
```

* Como vou permitir gerenciar o node master? SwarmMasterCreator

## SwarmMasterCreator

Permite a orquestração de node masters para outras VMs. Cada VM só pode ter 1 node master.
Como gerenciar nodes como VMs, a interface seria parecida com a dashboard da EC2.

## Preparing Host

* Config: Ubuntu
* Objetivos:
  - Instalar Docker Swarm
  - Instalar Portainer para gerenciar stacks através de API REST
  - Gerenciar usuarios administradores e autorização
  - Demonstrar login e interação com API do portainer para subir 1 container (exemplo nginx:latest)

## Preparing Host Image (based on AWS AMI)

- Utilizar o Cloudformation para especificar uma AMI
- AMI contents: docker > v19 and 

## Setup Docker specs

### Docker Swarm

* `docker system info`: verify if Docker Swarm is active
* `docker swarm init`: setup docker swarm 

### Set up Docker Registry

* `docker service create --name registry --publish published=5000,target=5000 registry:2`
* test: `curl localhost:5000/v2/` and `docker service ls`

### Install Portainer

* `curl -L https://downloads.portainer.io/agent-stack.yml -o agent-stack.yml && docker stack deploy --compose-file=agent-stack.yml portainer-agent`

### Build Image with Docker Compose

* `docker-compose -f wp-stack.yml up -d`

### Down and Remove volumes

* `docker-compose -f wp-stack down --volumes`

### Docker Push images to Registry

* `docker-compose -f wp-stack.yml push`

### Swarm Deploy

* `docker stack deploy -c wp-stack.yml stackdemo`