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

```bash
curl -L https://downloads.portainer.io/portainer-agent-stack.yml -o portainer-agent-stack.yml
docker stack deploy --compose-file=portainer-agent-stack.yml portainer

# or (docker endpoints works!)
docker volume create portainer_data
docker run -d -p 9000:9000 -p 8000:8000 --name portainer --restart always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data portainer/portainer
```

* HTTPS (more secure): https://portainer.readthedocs.io/en/stable/deployment.html#secure-portainer-using-ssl

### Build Image with Docker Compose

* `docker-compose -f wp-stack.yml up -d`

### Down and Remove volumes

* `docker-compose -f wp-stack down --volumes`

### Docker Push images to Registry

* `docker-compose -f wp-stack.yml push`

### Swarm Deploy

* `docker stack deploy -c wp-stack.yml stackdemo`

## Registering Docker Endpoint with Portainer

## Creating Docker Context

```sh
docker context create wordpress-ops-ctx \
  --default-stack-orchestrator=swarm \
  --docker host=unix:///var/run/docker.sock
```

* List Contexts

```sh
docker context ls

NAME                DESCRIPTION                               DOCKER ENDPOINT               KUBERNETES ENDPOINT   ORCHESTRATOR
default *           Current DOCKER_HOST based configuration   unix:///var/run/docker.sock                         swarm
docker-test                                                   unix:///var/run/docker.sock                         swarm
```

* Docker Contexts metatada stored in `~/.docker/contexts/...`

## Switch Docker Context

```sh
docker context use docker-test
```

## Change Docker Context description

```sh
docker context update k8s-test --description "Test Kubernetes cluster"
```

## PROBLEM: ao se mudar o docker context, parece que o mecanismo de credenciais deu problema

* Solução: https://stackoverflow.com/questions/50151833/cannot-login-to-docker-account

## Configuração do Amazon Linux 2 (VirtualBox Machine)

```
Users: root, ec2-user
Password: root -> cr...default, ec2-user -> cr...default
```

Configurando AMZLNX2

* VirtualBox VM entering...

```
ssh ec2-user@127.0.0.1 -p 2222
# password: cr....
```

```
sudo yum update -y
sudo amazon-linux-extras install docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Make docker auto-start
sudo chkconfig docker on

# Because you always need it....
sudo yum install -y git

# Reboot to verify it all loads fine on its own.
sudo reboot

# Install Docker Compose
sudo curl -L https://github.com/docker/compose/releases/download/1.25.3/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

docker-compose version
```

## Criando usuarios no Portainer

```
username: cristian
password: 12345678
admin: false
```

## Docker REST API

https://docs.docker.com/engine/api/v1.39/
https://gist.github.com/deviantony/77026d402366b4b43fa5918d41bc42f8