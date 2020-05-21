#seting up env
command -v node >/dev/null 2>&1 || { curl -sL https://deb.nodesource.com/setup_5.x |  bash - &&  apt-get install -qq -y nodejs; }
command -v docker >/dev/null 2>&1 || { curl https://get.docker.com/ |  sh && echo 'DOCKER_OPTS="--storage-driver=devicemapper"' |  tee --append /etc/default/docker >/dev/null &&  service docker start ||  service docker restart; }
command -v meteor >/dev/null 2>&1 || { curl https://install.meteor.com/ | sh; }
# command -v mkfs.xfs >/dev/null 2>&1 || { sudo apt-get -qq -y install xfsprogs; }

export MUP_DIR=$PWD
{
rm -rf /tmp/tests
mkdir /tmp/tests
cp -rf $MUP_DIR/tests/fixtures/* /tmp/tests
cd /tmp/tests/
rm -rf new*
eval `ssh-agent`


docker rm -f $( docker ps -a -q --filter=ancestor=orup-tests-server )
docker rm -f $( docker ps -a -q --filter=ancestor=orup-tests-server-docker )
} > /dev/null

if [[ -z $( docker images -aq orup-tests-server) ]]; then
    echo "Building orup-tests-server"
    docker build -t orup-tests-server . > /dev/null
fi

if [[ -z $( docker images -aq orup-tests-server-docker) ]]; then
    echo "Building orup-tests-server-docker"
    docker build -f ./Dockerfile_docker -t orup-tests-server-docker . > /dev/null
    docker run -d --name orup-tests-server-docker-setup --privileged orup-tests-server-docker
    sleep 2
    docker exec orup-tests-server-docker-setup service docker start
    docker exec -t orup-tests-server-docker-setup docker pull mongo:3.4.1
    docker exec -t orup-tests-server-docker-setup docker pull kadirahq/meteord
    docker exec -t orup-tests-server-docker-setup docker pull abernix/meteord:base
    docker exec -t orup-tests-server-docker-setup docker pull jwilder/nginx-proxy
    docker exec -t orup-tests-server-docker-setup docker pull jrcs/letsencrypt-nginx-proxy-companion:latest
    docker commit orup-tests-server-docker-setup orup-tests-server-docker
    docker rm -f orup-tests-server-docker-setup
fi

{
cd $MUP_DIR
rm -rf ./tests/fixtures/ssh
mkdir ./tests/fixtures/ssh
cd ./tests/fixtures/ssh
ssh-keygen -f new -t rsa -N ''
chmod 600 new.pub
sudo chown root:root new.pub

cd $MUP_DIR
} > /dev/null

npm link
