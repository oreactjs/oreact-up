/* eslint-disable no-unused-expressions */
import chai, { expect } from 'chai';
import { countOccurences, runSSHCommand } from '../../../utils';
import { describe, it } from 'mocha';
import chaiString from 'chai-string';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sh from 'shelljs';

chai.use(chaiString);

sh.config.silent = false;
const servers = require('../../../../tests/fixtures/servers');

describe('module - default', function() {
  this.timeout(900000);

  describe('deploy', () => {
    it('should deploy oreact app on "oreact" vm', async () => {
      const serverInfo = servers.myoreact;
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));
      sh.exec('mup setup');

      const out = sh.exec('mup deploy --cached-build');

      expect(out.code).to.equal(0);
      expect(
        out.output
      ).satisfy(text => {
        if (text.indexOf('Building App Bundle Locally') > -1) {
          return true;
        }

        return text.indexOf('Using build from previous deploy at') > -1;
      });

      expect(
        countOccurences(
          'Pushing oreact App Bundle to the Server: SUCCESS',
          out.output
        )
      ).to.be.equal(1);
      expect(
        countOccurences('Pushing the Startup Script: SUCCESS', out.output)
      ).to.be.equal(1);
      expect(
        countOccurences('Sending Environment Variables: SUCCESS', out.output)
      ).to.be.equal(1);
      expect(countOccurences('Start oreact: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(
        countOccurences('Verifying Deployment: SUCCESS', out.output)
      ).to.be.equal(1);
      const ssh1 = await runSSHCommand(
        serverInfo,
        'nc -z -v -w5 localhost 27017'
      );
      expect(ssh1.code).to.be.equal(0);
      const ssh2 = await runSSHCommand(
        serverInfo,
        'curl localhost:80 && exit 0'
      );
      expect(ssh2.code).to.be.equal(0);
    });
  });

  describe('init', () => {
    it('should create "mup.js" and "setting.json" in /tmp/project-tmp', () => {
      const dir = path.resolve(os.tmpdir(), 'project-tmp');
      sh.mkdir(dir);
      sh.cd(dir);
      sh.exec('mup init');
      expect(fs.existsSync(path.resolve(dir, 'mup.js'))).to.true;
      expect(fs.existsSync(path.resolve(dir, 'settings.json'))).to.true;
      sh.rm('-rf', dir);
    });
  });

  describe('logs', () => {
    it('should pull the logs from oreact app', () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));
      const out = sh.exec('mup logs --tail 2');
      expect(out.code).to.be.equal(0);
    });
  });

  describe('reconfig', () => {
    it('should reconfig oreact app on "oreact" vm', async () => {
      const serverInfo = servers.myoreact;
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));
      sh.exec('mup setup  && mup deploy --cached-build');

      const out = sh.exec('mup reconfig');

      expect(out.code).to.be.equal(0);
      expect(
        countOccurences('Sending Environment Variables: SUCCESS', out.output)
      ).to.be.equal(1);
      expect(countOccurences('Start oreact: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(
        countOccurences('Verifying Deployment: SUCCESS', out.output)
      ).to.be.equal(1);
      expect(
        (await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0')).code
      ).to.be.equal(0);
    });
  });

  describe('restart', () => {
    it('should restart oreact app on "oreact" vm', async () => {
      const serverInfo = servers.myoreact;
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));
      sh.exec('mup setup  && mup deploy --cached-build');

      const out = sh.exec('mup restart');

      expect(out.code).to.be.equal(0);
      expect(out.output).to.have.entriesCount('Stop oreact: SUCCESS', 1);
      expect(out.output).to.have.entriesCount('Start oreact: SUCCESS', 1);
      expect(
        out.output
      ).to.have.entriesCount('Verifying Deployment: SUCCESS', 1);
      expect(
        (await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0')).code
      ).to.be.equal(0, 'Curl exit code');
    });
  });

  describe('setup', () => {
    it('should setup "oreact" vm', async () => {
      const serverInfo = servers.myoreact;
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));

      const out = sh.exec('mup setup');

      expect(out.code).to.be.equal(0);
      expect(countOccurences('Setup Docker: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(
        countOccurences('Setup Environment: SUCCESS', out.output)
      ).to.be.equal(2);
      expect(countOccurences('Start Mongo: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(
        (await runSSHCommand(serverInfo, 'nc -z -v -w5 localhost 27017')).code
      ).to.be.equal(0);
    });
  });

  describe('start', () => {
    it('should start oreact app on "oreact" vm', async () => {
      const serverInfo = servers.myoreact;
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));
      sh.exec('mup setup  && mup oreact push --cached-build && mup oreact envconfig');

      const out = sh.exec('mup start');

      expect(out.code).to.be.equal(0);
      expect(countOccurences('Start oreact: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(
        countOccurences('Verifying Deployment: SUCCESS', out.output)
      ).to.be.equal(1);
      expect(
        (await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0')).code
      ).to.be.equal(0);
    });
  });

  describe('stop', () => {
    it('should stop oreact app on "oreact" vm', async () => {
      const serverInfo = servers.myoreact;
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-1'));
      sh.exec('mup setup  && mup deploy --cached-build');

      const out = sh.exec('mup stop');

      expect(out.code).to.be.equal(0);
      expect(countOccurences('Stop oreact: SUCCESS', out.output)).to.be.equal(
        1
      );
      expect(
        (await runSSHCommand(serverInfo, 'curl localhost:80 && exit 0')).code
      ).to.be.equal(7);
    });
  });

  describe('syslog', () => {
    const serverInfo = servers.myoreact;

    it('should write oreact logs to syslog on "oreact" vm', async () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-2'));

      sh.exec('mup setup && mup deploy --cached-build');
      const out = await runSSHCommand(
        serverInfo,
        'sudo tail -n 100 /var/log/syslog'
      );
      expect(out.code).to.be.equal(0);

      expect(
        countOccurences('=> Starting oreact app on port:80', out.output)
      ).gte(1);
    });
  });
});
