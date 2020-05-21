export function checkAppStarted(list, api) {
  const script = api.resolvePath(__dirname, 'assets/oreact-deploy-check.sh');
  const { app } = api.getConfig();
  const publishedPort = app.docker.imagePort || 80;

  list.executeScript('Verifying Deployment', {
    script,
    vars: {
      deployCheckWaitTime: app.deployCheckWaitTime || 60,
      appName: app.name,
      deployCheckPort: publishedPort
    }
  });

  return list;
}

export function addStartAppTask(list, api) {
  const appConfig = api.getConfig().app;
  const isDeploy = api.commandHistory.find(({ name }) => name === 'oreact.deploy');

  list.executeScript('Start Oreact', {
    script: api.resolvePath(__dirname, 'assets/oreact-start.sh'),
    vars: {
      appName: appConfig.name,
      removeImage: isDeploy && !prepareBundleSupported(appConfig.docker)
    }
  });

  return list;
}

export function prepareBundleSupported(dockerConfig) {
  const supportedImages = ['oreact/app'];

  if ('prepareBundle' in dockerConfig) {
    return dockerConfig.prepareBundle;
  }

  return supportedImages.find(
    supportedImage => dockerConfig.image.indexOf(supportedImage) === 0
  ) || false;
}
