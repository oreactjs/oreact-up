import debug from 'debug';
import fs from 'fs';
import path from 'path';
import sh from 'shelljs';

const log = debug('mup:init');

sh.config.silent = true;

function findDestination(api) {
  const base = process.cwd();

  const inOreactApp = fs.existsSync(api.resolvePath(base, 'razzle.config.js'));
  const parentOreactApp = fs.existsSync(api.resolvePath(base, '../razzle.config.js'));
  const parentChildren = fs.readdirSync(api.resolvePath(base, '../'));
  let siblingOreactApp = false;
  let otherChild = '';

  if (parentChildren.length === 2) {
    otherChild = parentChildren
      .filter(child => child !== path.basename(base))[0];
    if (fs.existsSync(api.resolvePath('..', otherChild, 'razzle.config.js'))) {
      siblingOreactApp = true;
    }
  }

  log('in oreact app', inOreactApp);
  log('Parent Oreact app', parentOreactApp);
  log('siblingOreactApp', siblingOreactApp);

  let dest = base;
  let appPath = './';
  let createFolder = false;

  if (inOreactApp) {
    dest = api.resolvePath(base, '.deploy');
    appPath = '../';
    createFolder = true;
  } else if (parentOreactApp) {
    dest = base;
    appPath = '../';
  } else if (siblingOreactApp) {
    dest = base;
    appPath = `../${otherChild}`;
  }

  return {
    appPath,
    dest,
    createFolder
  };
}

function createDeployFolder(api) {
  const base = process.cwd();
  const folderPath = api.resolvePath(base, '.deploy');
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }
}

export default function init(api) {
  const configSource = api.resolvePath(__dirname, 'template/mup.js.sample');
  const settingsSource = api.resolvePath(__dirname, 'template/settings.json');

  const { appPath, dest, createFolder } = findDestination(api);

  const settingsDest = api.resolvePath(dest, 'settings.json');
  const configDest = api.resolvePath(dest, 'mup.js');

  const configExists = fs.existsSync(api.resolvePath(configDest));
  const settingsExist = fs.existsSync(settingsDest);

  if (createFolder) {
    createDeployFolder(api);
    console.log('Created .deploy folder');
  }

  if (!settingsExist) {
    sh.cp(settingsSource, settingsDest);
    console.log(`Created settings.json at ${settingsDest}`);
  } else {
    console.log('Skipping creation of settings.json.');
    console.log(`settings.json already exists at ${settingsDest}`);
  }

  if (!configExists) {
    const configContents = fs.readFileSync(configSource).toString()
      .replace('<app path>', appPath);
    fs.writeFileSync(configDest, configContents);

    console.log(`Created mup.js at ${configDest}`);
    console.log('');
    console.log('Next Steps:');
    console.log('');
    console.log('  Open mup.js and edit the config to meet your needs.');
    console.log('  Required changes have been marked with a TODO comment.');
    console.log('');
    console.log('  Then, run the command:');
    console.log('  mup setup');
  } else {
    console.log('Skipping creation of mup.js');
    console.log(`mup.js already exists at ${configDest}`);
  }
}
