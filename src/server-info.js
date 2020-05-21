import debug from 'debug';
import { map } from 'bluebird';
import { runSSHCommand } from './utils';

const log = debug('orup:server-info');

function parseJSONArray(stdout, code) {
  if (code === 0) {
    try {
      let output = stdout.split('\n').join(',');
      output = `[${output}]`;

      const result = JSON.parse(output);

      if (!(result instanceof Array)) {
        return [result];
      }

      return result;
    } catch (e) {
      return null;
    }
  }

  return null;
}

export const builtInParsers = {
  json(stdout, code) {
    if (code === 0) {
      try {
        return JSON.parse(stdout);
      } catch (e) {
        return null;
      }
    }

    return null;
  },
  jsonArray: parseJSONArray
};

export const _collectors = {
  swarm: {
    command: 'docker info --format \'{{json .Swarm}}\'',
    parser(stdout, code) {
      if (code === 0) {
        try {
          return JSON.parse(stdout);
        } catch (e) {
          return null;
        }
      }

      return null;
    }
  },
  swarmNodes: {
    command: 'docker node inspect $(docker node ls -q) --format \'{{json .}}\'',
    parser: parseJSONArray
  },
  swarmToken: {
    command: 'docker swarm join-token worker -q',
    parser(stdout, code) {
      if (code === 0 && stdout.indexOf('Error response') === -1) {
        return stdout.trim();
      }

      return null;
    }
  },
  swarmServices: {
    command: 'docker service ls --format \'{{json .}}\'',
    parser: parseJSONArray
  },
  images: {
    command: 'docker images --format \'{{json .}}\'',
    parser: parseJSONArray
  }
};

const prefix = '<============orup-var-start========';
const suffix = '================orup-var-stop=====>';
const codeSeperator = 'orup-var-code=======';

function generateVarCommand(name, command) {
  return `
  echo "${prefix}${name}${suffix}"
  ${command} 2>&1
  echo "${codeSeperator}"
  echo $?
  `;
}

function generateScript(collectors) {
  let script = '';
  Object.keys(collectors).forEach(key => {
    const collector = collectors[key];
    script += generateVarCommand(key, collector.command);
  });

  return script;
}

export function seperateCollectors(output) {
  const collectors = output.split(prefix);
  collectors.shift();

  return collectors.map(collectorOutput => {
    const name = collectorOutput.split(suffix)[0];
    const commandOutput = collectorOutput
      .split(suffix)[1]
      .split(codeSeperator)[0];

    return {
      name: name.trim(),
      output: commandOutput.trim(),
      code: parseInt(collectorOutput.split(codeSeperator)[1].trim(), 10)
    };
  });
}

export function parseCollectorOutput(name, output, code, collectors) {
  if (typeof collectors[name].parser === 'string') {
    return builtInParsers[collectors[name].parser](output, code);
  }

  return collectors[name].parser(output, code);
}

export function createHostResult(collectorData, host, collectors) {
  const result = { _host: host };
  collectorData.forEach(data => {
    result[data.name] = parseCollectorOutput(
      data.name,
      data.output,
      data.code,
      collectors
    );
  });

  return result;
}

export function getServerInfo(server, collectors) {
  const command = generateScript(collectors);

  return runSSHCommand(server, command)
    .then(result => {
      const collectorData = seperateCollectors(result.output);
      const hostResult = createHostResult(
        collectorData,
        server.host,
        collectors
      );

      return hostResult;
    })
    .catch(err => {
      console.log(err, server);
    });
}

export default function serverInfo(servers, collectors = _collectors) {
  log('starting');

  return map(
    servers,
    server => getServerInfo(server, collectors),
    { concurrency: 2 }
  ).then(serverResults => {
    const result = {};
    serverResults.forEach(serverResult => {
      result[serverResult._host] = serverResult;
    });

    log('finished');

    return result;
  });
}
