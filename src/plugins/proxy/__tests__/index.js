import chai, { expect } from 'chai';
import { describe, it } from 'mocha';
import chaiString from 'chai-string';
import os from 'os';
import path from 'path';
import { runSSHCommand } from '../../../utils';
import sh from 'shelljs';
const servers = require('../../../../tests/fixtures/servers');

chai.use(chaiString);

sh.config.silent = false;

describe('module - proxy', function() {
  this.timeout(60000000);

  describe('setup', () => {
    it('should setup proxy on "oreact" vm', async () => {
      const serverInfo = servers.myoreact;
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-3'));
      let out = sh.exec('orup setup');

      expect(out.code).to.equal(0);
      expect(out.output).to.have.entriesCount('Setup proxy', 1);
      expect(out.output).to.have.entriesCount('Start proxy: SUCCESS', 1);

      out = await runSSHCommand(serverInfo, 'docker ps');

      expect(out.code).to.equal(0);
      expect(out.output).to.have.entriesCount('orup-nginx-proxy', 2);
      expect(out.output).to.have.entriesCount('orup-nginx-proxy-letsencrypt', 1);

      out = await runSSHCommand(serverInfo, 'du --max-depth=2 /opt');
      expect(out.output).to.have.entriesCount('/opt/orup-nginx-proxy', 4);
      expect(out.output).to.have.entriesCount('/opt/orup-nginx-proxy/certs', 1);
      expect(out.output).to.have.entriesCount('/opt/orup-nginx-proxy/mounted-certs', 1);
      expect(out.output).to.have.entriesCount('/opt/orup-nginx-proxy/config', 1);

      out = await runSSHCommand(serverInfo, 'ls /opt/orup-nginx-proxy/config');
      expect(out.output).to.have.entriesCount('shared-config.sh', 1);
      expect(out.output).to.have.entriesCount('env.list', 1);
      expect(out.output).to.have.entriesCount('env_letsencrypt.list', 1);
    });
  });

  describe('reconfig-shared', () => {
    it('it should update shared settings', async () => {
      const serverInfo = servers.myoreact;
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-3'));
      sh.exec('orup setup');

      let out = sh.exec('orup proxy reconfig-shared');
      expect(out.code).to.equal(0);
      expect(out.output).to.have.entriesCount('Configuring Proxy\'s Shared Settings', 1);
      expect(out.output).to.have.entriesCount('Start proxy: SUCCESS', 1);

      out = await runSSHCommand(serverInfo, 'cat /opt/orup-nginx-proxy/config/shared-config.sh');
      expect(out.output).to.have.entriesCount('CLIENT_UPLOAD_LIMIT=10M', 1);
    });
  });

  describe('logs', () => {
    it('should show nginx logs', () => {
      sh.cd(path.resolve(os.tmpdir(), 'tests/project-3'));
      sh.exec('orup setup');

      const out = sh.exec('orup proxy logs --tail 2');
      expect(out.output).to.have.entriesCount('Received event start for', 1);
      expect(out.code).to.equal(0);
    });
  });
});
