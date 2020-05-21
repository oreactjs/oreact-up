/* eslint-disable no-var */

var sh = require('shelljs');
var os = require('os');
var path = require('path');
var fs = require('fs');
var keypair = require('keypair');
var forge = require('node-forge');
var argv = require('yargs').argv;

if (process.platform !== 'win32') {
  var installCommands = [
    'command -v node >/dev/null 2>&1 || { curl -sL https://deb.nodesource.com/setup_5.x |  bash - &&  apt-get install -qq -y nodejs; }',
    'command -v docker >/dev/null 2>&1 || { curl https://get.docker.com/ |  sh && echo \'DOCKER_OPTS="--storage-driver=devicemapper"\' |  tee --append /etc/default/docker >/dev/null &&  service docker start ||  service docker restart; }',
    'command -v meteor >/dev/null 2>&1 || { curl https://install.meteor.com/ | sh; }'
  ];
  installCommands.forEach(command => {
    sh.exec(command);
  });
}

var orupDir = process.cwd();
var tmp = path.resolve(os.tmpdir(), 'tests');
var helloapp = path.resolve(orupDir, 'tests/fixtures/helloapp');

if (!fs.existsSync(path.resolve(helloapp, 'node_modules'))) {
  sh.cd(path.resolve(orupDir, 'tests/fixtures/helloapp'));
  sh.exec('npm install');
}


sh.rm('-fr', tmp);
sh.mkdir(tmp);
sh.cp('-rf', path.resolve(orupDir, 'tests/fixtures/*'), tmp);
var containers = sh.exec('docker ps -a -q --filter=ancestor=orup-tests-server');

if (containers.output.length > 0) {
  console.log('server containers');
  sh.exec(`docker rm -f ${containers.output.trim().split('\n').join(' ')}`);
}

containers = sh.exec(
  'docker ps -a -q --filter=ancestor=orup-tests-server-docker'
);
if (containers.output.length > 0) {
  console.log('docker containers');
  sh.exec(`docker rm -f ${containers.output.trim()}`);
}

sh.cd(path.resolve(orupDir, 'tests/fixtures'));

var images = sh.exec('docker images -aq orup-tests-server');
if (images.output.length === 0) {
  sh.exec('docker build -t orup-tests-server .');
}

images = sh.exec('docker images -aq orup-tests-server-docker');
if (images.output.length === 0 && !argv.skipPull) {
  console.log('building image');
  var commands = [
    'docker build -f ./Dockerfile_docker -t orup-tests-server-docker .',
    'docker run -d --name orup-tests-server-docker-setup --privileged orup-tests-server-docker',
    'docker exec orup-tests-server-docker-setup service docker start',
    'docker exec -t orup-tests-server-docker-setup docker pull mongo:3.4.1',
    'docker exec -t orup-tests-server-docker-setup docker pull kadirahq/meteord',
    'docker exec -t orup-tests-server-docker-setup docker pull oreact/app:base',
    'docker exec -t orup-tests-server-docker-setup docker pull jwilder/nginx-proxy',
    'docker exec -t orup-tests-server-docker-setup docker pull jrcs/letsencrypt-nginx-proxy-companion:latest',
    'docker commit orup-tests-server-docker-setup orup-tests-server-docker',
    'docker rm -f orup-tests-server-docker-setup'
  ];
  commands.forEach(command => {
    var code = sh.exec(command).code;
    if (code > 0) {
      process.exit(code);
    }
  });
}

var location = path.resolve(orupDir, 'tests/fixtures/ssh/new');
if (!fs.existsSync(location)) {
  sh.cd(path.resolve(orupDir, 'tests/fixtures'));

  sh.rm('-rf', 'ssh');
  sh.mkdir('ssh');
  sh.cd('ssh');
  var pair = keypair();
  var publicKey = forge.pki.publicKeyFromPem(pair.public);

  fs.writeFileSync(location, pair.private);
  fs.writeFileSync(
    `${location}.pub`,
    forge.ssh.publicKeyToOpenSSH(publicKey, 'tests@test.com')
  );

  sh.chmod(600, 'new.pub');
  if (process.platform !== 'win32') {
    sh.exec('sudo chown root:root new.pub');
  }
}

sh.cd(orupDir);
sh.exec('npm link');
