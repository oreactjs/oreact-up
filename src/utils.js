import { Client } from 'ssh2';
import debug from 'debug';
import expandTilde from 'expand-tilde';
import fs from 'fs';
import path from 'path';
import { promisify } from 'bluebird';
import readline from 'readline';
import stream from 'stream';

const log = debug('orup:utils');

export function addStdioHandlers(list) {
  list._taskQueue = list._taskQueue.map(task => {
    task.options = task.options || {};

    task.options.onStdout = () => data => {
      process.stdout.write(data);
    };

    task.options.onStderr = () => data => {
      process.stderr.write(data);
    };

    return task;
  });
}

export function runTaskList(list, sessions, opts) {
  if (opts && opts.verbose) {
    addStdioHandlers(list);
    delete opts.verbose;
  }

  return new Promise((resolve, reject) => {
    list.run(sessions, opts, summaryMap => {
      for (const host in summaryMap) {
        if (summaryMap.hasOwnProperty(host)) {
          const summary = summaryMap[host];
          if (summary.error) {
            const error = summary.error;
            error.nodemiralHistory = summary.history;
            reject(error);

            return;
          }
        }
      }

      resolve();
    });
  });
}

// Implements a simple readable stream to pass
// the logs from nodemiral to readline which
// then splits it into individual lines.
class Callback2Stream extends stream.Readable {
  constructor(options) {
    // Calls the stream.Readable(options) constructor
    super(options);

    this.data = [];
  }
  addData(data) {
    if (this.reading) {
      this.reading = this.push(data);
    } else {
      this.data.push(data);
    }
  }
  _read() {
    this.reading = true;
    this.data.forEach(() => {
      const shouldContinue = this.reading && this.push(this.data.shift());
      if (!shouldContinue) {
        this.reading = false;
      }
    });
  }
}

export function getDockerLogs(name, sessions, args) {
  const command = `sudo docker ${args.join(' ')} ${name} 2>&1`;

  log(`getDockerLogs command: ${command}`);

  const promises = sessions.map(session => {
    const input = new Callback2Stream();
    const host = `[${session._host}]`;
    const lineSeperator = readline.createInterface({
      input,
      terminal: true
    });
    lineSeperator.on('line', data => {
      console.log(host + data);
    });
    const options = {
      onStdout: data => {
        input.addData(data);
      },
      onStderr: data => {
        // the logs all come in on stdout so stderr isn't added to lineSeperator
        process.stdout.write(host + data);
      }
    };

    return promisify(session.execute.bind(session))(command, options);
  });

  return Promise.all(promises);
}

export function createSSHOptions(server) {
  const sshAgent = process.env.SSH_AUTH_SOCK;
  const ssh = {
    host: server.host,
    port: (server.opts && server.opts.port) || 22,
    username: server.username
  };

  if (server.pem) {
    ssh.privateKey = fs.readFileSync(resolvePath(server.pem), 'utf8');
  } else if (server.password) {
    ssh.password = server.password;
  } else if (sshAgent && fs.existsSync(sshAgent)) {
    ssh.agent = sshAgent;
  }

  return ssh;
}

// Maybe we should create a new npm package
// for this one. Something like 'sshelljs'.
export function runSSHCommand(info, command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    // TODO better if we can extract SSH agent info from original session
    const sshAgent = process.env.SSH_AUTH_SOCK;
    const ssh = {
      host: info.host,
      port: (info.opts && info.opts.port) || 22,
      username: info.username
    };

    if (info.pem) {
      ssh.privateKey = fs.readFileSync(resolvePath(info.pem), 'utf8');
    } else if (info.password) {
      ssh.password = info.password;
    } else if (sshAgent && fs.existsSync(sshAgent)) {
      ssh.agent = sshAgent;
    }
    conn.connect(ssh);

    conn.once('error', err => {
      if (err) {
        reject(err);
      }
    });

    // TODO handle error events
    conn.once('ready', () => {
      conn.exec(command, (err, outputStream) => {
        if (err) {
          conn.end();
          reject(err);

          return;
        }

        let output = '';

        outputStream.on('data', data => {
          output += data;
        });

        outputStream.once('close', code => {
          conn.end();
          resolve({ code, output, host: info.host });
        });
      });
    });
  });
}

export function countOccurences(needle, haystack) {
  const regex = new RegExp(needle, 'g');
  const match = haystack.match(regex) || [];

  return match.length;
}

export function resolvePath(...paths) {
  const expandedPaths = paths.map(_path => expandTilde(_path));

  return path.resolve(...expandedPaths);
}

/**
 * Checks if the module not found is a certain module
 *
 * @param {Error} e - Error that was thwon
 * @param {String} modulePath - path to the module to compare the error to
 * @returns {Boolean} true if the modulePath and path in the error is the same
 */
export function moduleNotFoundIsPath(e, modulePath) {
  const pathPosition = e.message.length - modulePath.length - 1;

  return e.message.indexOf(modulePath) === pathPosition;
}

export function argvContains(argvArray, option) {
  if (argvArray.indexOf(option) > -1) {
    return true;
  }

  return argvArray.find(value => value.indexOf(`${option}=`) > -1);
}

export function createOption(key) {
  if (key.length > 1) {
    return `--${key}`;
  }

  return `-${key}`;
}

export function filterArgv(argvArray, argv, unwanted) {
  const result = argv._.slice();

  Object.keys(argv).forEach(key => {
    const option = createOption(key);

    if (
      unwanted.indexOf(key) === -1 &&
      argv[key] !== false &&
      argv[key] !== undefined
    ) {
      if (!argvContains(argvArray, option)) {
        return;
      }

      result.push(option);

      if (typeof argv[key] !== 'boolean') {
        result.push(argv[key]);
      }
    }
  });

  return result;
}
