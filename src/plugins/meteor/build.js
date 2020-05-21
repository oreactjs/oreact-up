import debug from 'debug';
import fs from 'fs';
import { spawn } from 'child_process';
import tar from 'tar';

const log = debug('mup:module:meteor');

export default function buildApp(appPath, buildOptions, verbose, api) {
  // Check if the folder exists
  try {
    fs.statSync(api.resolvePath(appPath));
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log(`${api.resolvePath(appPath)} does not exist`);
    } else {
      console.log(e);
    }

    process.exit(1);
  }

  // Make sure if package.json exists
  try {
    fs.statSync(api.resolvePath(appPath,'package.json'));
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log(`${api.resolvePath(appPath,'package.json')} does not exist`);
    } else {
      console.log(e);
    }
    process.exit(1);
  }

  // Make sure if .env.production exists
  try {
    fs.statSync(api.resolvePath(appPath,'.env.production'));
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log(`${api.resolvePath(appPath,'.env.production')} does not exist`);
    } else {
      console.log(e);
    }
    process.exit(1);
  }

  // Make sure it is a Oreact app
  try {
    // checks for release file since there also is a
    // .meteor folder in the user's home
    fs.statSync(api.resolvePath(appPath, 'razzle.config.js'));
  } catch (e) {
    console.log(`${api.resolvePath(appPath)} is not a oreact app`);
    process.exit(1);
  }

  return new Promise((resolve, reject) => {
    const callback = err => {
      if (err) {
        reject(err);

        return;
      }
      resolve();
    };
    buildMeteorApp(appPath, buildOptions, verbose, code => {
      if (code === 0) {
        callback();

        return;
      }
      console.log('\n=> Build Error. Check the logs printed above.');
      process.exit(1);
    });
  });
}

function buildMeteorApp(appPath, buildOptions, verbose, callback) {
  let executable = buildOptions.executable || 'oreact';
  let args = [
    'build'
  ];

  const isWin = /^win/.test(process.platform);
  if (isWin) {
    // Sometimes cmd.exe not available in the path
    // See: http://goo.gl/ADmzoD
    executable = process.env.comspec || 'cmd.exe';
    args = ['/c', 'oreact'].concat(args);
  }

  const options = {
    cwd: appPath,
    env: {
      ...process.env
    },
    stdio: verbose ? 'inherit' : 'pipe'
  };

  log(`Build Path: ${appPath}`);
  log(`Build Command:  ${executable} ${args.join(' ')}`);

  const oreact = spawn(executable, args, options);

  if (!verbose) {
    oreact.stdout.pipe(process.stdout, { end: false });
    oreact.stderr.pipe(process.stderr, { end: false });
  }

  oreact.on('error', e => {
    console.log(options);
    console.log(e);
    console.log('This error usually happens when oreact-cli is not installed.');
  });
  oreact.on('close', callback);
}

export function archiveApp(buildOptions, api, cb) {

  const bundlePath = api.resolvePath(buildOptions.tmpDirLocation, 'bundle.tar.gz');

  log('starting archive');
  tar.c({
    file: bundlePath,
    prefix: 'bundle',
    onwarn(message, data) { console.log(message, data); },
    cwd: api.resolvePath(buildOptions.buildLocation, '../'),
    portable: true,
    gzip: {
      level: 9
    }
  }, ['build', 'package.json', '.env.production'], err => {
    log('archive finished');

    if (err) {
      console.log('=> Archiving failed: ', err.message);
    }

    cb(err);
  });
}
