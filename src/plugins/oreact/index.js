import * as _commands from './commands';
import _validator from './validate';
import { defaultsDeep } from 'lodash';
import traverse from 'traverse';

export const description = 'Deploy and manage oreact apps';

export const commands = _commands;

export const validate = {
  oreact: _validator,
  app(config, utils) {
    if (typeof config.oreact === 'object' || (config.app && config.app.type !== 'oreact')) {
      // The oreact validator will check the config
      // Or the config is telling a different app to handle deployment
      return [];
    }

    return _validator(config, utils);
  }
};

export function prepareConfig(config) {
  if (!config.app || config.app.type !== 'oreact') {
    return config;
  }

  config.app.docker = defaultsDeep(config.app.docker, {
    image: config.app.dockerImage || 'oreact/app:base',
    stopAppDuringPrepareBundle: true
  });

  delete config.app.dockerImage;

  return config;
}

function oreactEnabled(api) {
  const config = api.getConfig();

  return config.app && config.app.type === 'oreact';
}

function onlyOreactEnabled(...commandNames) {
  return function(api) {
    let index = 0;

    function thenHandler() {
      index += 1;
      if (commandNames.length > index) {
        return api.runCommand(commandNames[index]).then(thenHandler);
      }
    }

    if (oreactEnabled(api)) {
      return api.runCommand(commandNames[index]).then(thenHandler);
    }
  };
}

export const hooks = {
  'post.default.setup': onlyOreactEnabled('oreact.setup'),
  'post.default.deploy': onlyOreactEnabled('oreact.deploy'),
  'post.default.start': onlyOreactEnabled('oreact.start'),
  'post.default.stop': onlyOreactEnabled('oreact.stop'),
  'post.default.logs': onlyOreactEnabled('oreact.logs'),
  'post.default.reconfig': onlyOreactEnabled('oreact.envconfig', 'oreact.start'),
  'post.default.restart': onlyOreactEnabled('oreact.restart'),
  'post.default.status': onlyOreactEnabled('oreact.status')
};

export function scrubConfig(config, utils) {
  if (config.oreact) {
    delete config.oreact;
  }

  if (config.app) {
    // eslint-disable-next-line
    config.app = traverse(config.app).map(function () {
      const path = this.path.join('.');

      switch (path) {
        case 'name':
          return this.update('my-app');

          return this.update(utils.scrubUrl(this.node));

        // no default
      }
    });
  }

  return config;
}

export function swarmOptions(config) {
  if (config && config.app && config.app.type === 'oreact') {
    return {
      labels: Object.keys(config.app.servers).reduce((result, server) => {
        result[server] = {
          [`orup-app-${config.app.name}`]: 'true'
        };

        return result;
      }, {})
    };
  }
}
