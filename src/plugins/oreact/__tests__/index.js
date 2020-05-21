import chai, { expect } from 'chai';
import { countOccurences, runSSHCommand } from '../../../utils';
import { describe, it } from 'mocha';
import assert from 'assert';
import chaiString from 'chai-string';
import os from 'os';
import path from 'path';
import sh from 'shelljs';

chai.use(chaiString);

sh.config.silent = false;
const servers = require('../../../../tests/fixtures/servers');

describe('module - oreact', function() {
  this.timeout(600000);

  describe('setup', () => {
    it('should setup environment on "oreact" vm', async () => {
      const serverInfo = servers.myoreact;

      await runSSHCommand(serverInfo, 'rm -rf /opt/myapp || :');
      await runSSHCommand(
        serverInfo,
        'command -v tree >/dev/null 2>&1 || { sudo apt-get -qq update && sudo apt-get -qq install -y tree; }'
      );

      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));

      const out = sh.exec('orup oreact setup');
      assert.equal(out.code, 0);

      const num = countOccurences('Setup Environment: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(serverInfo, 'tree -pufid /opt');
      expect(sshOut.output).to.have.entriesCount('/opt/myapp', 3);
      expect(sshOut.output).to.have.entriesCount('/opt/myapp/config', 1);
      expect(sshOut.output).to.have.entriesCount('/opt/myapp/tmp', 1);
    });
  });

  describe('push', () => {
    it('should push oreact app bundle to "oreact" vm', async () => {
      const serverInfo = servers.myoreact;

      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));

      sh.exec('orup docker setup');
      sh.exec('orup oreact setup');

      const out = sh.exec('orup oreact push --cached-build');
      assert.equal(out.code, 0);

      const num = countOccurences(
        'Pushing Oreact App Bundle to the Server: SUCCESS',
        out.output
      );
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(
        serverInfo,
        'ls -al /opt/myapp/tmp/bundle.tar.gz'
      );
      assert.equal(sshOut.code, 0);
    });
  });

  describe('envconfig', () => {
    const serverInfo = servers.myoreact;
    it('should send the environment variables to "oreact" vm', async () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));

      sh.exec('orup oreact setup');

      const out = sh.exec('orup oreact envconfig');
      assert.equal(out.code, 0);

      const num = countOccurences(
        'Sending Environment Variables: SUCCESS',
        out.output
      );
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(
        serverInfo,
        'ls -al /opt/myapp/config/env.list'
      );
      assert.equal(sshOut.code, 0);

      const sshOut2 = await runSSHCommand(
        serverInfo,
        'ls -al /opt/myapp/config/start.sh'
      );

      assert.equal(sshOut2.code, 0);
    });
    it('should push server specific env variables', async () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-2'));
      sh.exec('orup oreact setup');

      const out = sh.exec('orup oreact envconfig');

      expect(out.code).to.equal(0);

      const sshOut = await runSSHCommand(
        serverInfo,
        'cat /opt/myapp/config/env.list'
      );

      expect(sshOut.output).to.have.entriesCount('TEST=true', 1);
    });
  });

  describe('start', () => {
    const serverInfo = servers.myoreact;

    it('should start oreact on "oreact" vm', async () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));

      sh.exec(
        'orup setup && orup oreact push --cached-build && orup oreact envconfig'
      );
      const out = sh.exec('orup oreact start');
      assert.equal(out.code, 0);

      const num = countOccurences('Start Oreact: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(
        serverInfo,
        'curl localhost:80 && exit 0'
      );
      assert.equal(sshOut.code, 0);
    });
  });

  describe('deploy', () => {
    const serverInfo = servers.myoreact;

    async function checkDeploy(out, appText) {
      assert.equal(out.code, 0);

      const num = countOccurences(
        'Sending Environment Variables: SUCCESS',
        out.output
      );
      assert.equal(num, 1);

      const num2 = countOccurences('Start Oreact: SUCCESS', out.output);
      assert.equal(num2, 1);

      const num3 = countOccurences(
        'Pushing Oreact App Bundle to the Server: SUCCESS',
        out.output
      );
      assert.equal(num3, 1);

      const sshOut = await runSSHCommand(
        serverInfo,
        'curl localhost:80 && exit 0'
      );
      assert.equal(sshOut.code, 0);
      expect(sshOut.output).to.have.entriesCount(appText, 1);
    }

    it('should deploy oreact app on "oreact" vm', async () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));

      sh.exec('orup setup');
      const out = sh.exec('orup oreact deploy --cached-build');

      checkDeploy(out, '<title>helloapp-new</title>');
    });

    it('should deploy app using Oreact 1.2', async () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));

      sh.exec('orup setup --config orup.old.js');
      const out = sh.exec('orup oreact deploy --cached-build --config orup.old.js');
      expect(out.code).to.equal(0);
      checkDeploy(out, '<title>helloapp</title>');
    });
  });

  describe('logs', () => {
    it('should pull the logs from "oreact" vm', async () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));

      const out = sh.exec('orup oreact logs --tail 2');
      assert.equal(out.code, 0);
    });
  });

  describe('stop', () => {
    const serverInfo = servers.myoreact;
    it('should stop oreact app on "oreact" vm', async () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));

      sh.exec('orup setup && orup deploy --cached-build');
      const out = sh.exec('orup oreact stop');
      assert.equal(out.code, 0);

      const num = countOccurences('Stop Oreact: SUCCESS', out.output);
      assert.equal(num, 1);

      const sshOut = await runSSHCommand(
        serverInfo,
        'curl localhost:80 && exit 0'
      );
      assert.equal(sshOut.code, 7);
    });
  });
});
