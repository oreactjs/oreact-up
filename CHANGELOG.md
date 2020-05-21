## 1.4.6 - April 27, 2019
- Mongo and nginx logs are now rotated and limited to 700mb
- Fix error when running `mup setup` without a `servers` object in the config.

## 1.4.5 - June 9, 2018
- Add option to keep the app running during Prepare Bundle
- Add `app.docker.prepareBundle` to example config
- Update node-tar to fix deploying from Windows
- Fix mongo container starting when stopped with `docker stop` and docker daemon is restarted (@pravdomil)
- Fix verifying deployment when using user defined network
- Fix proxy.clientUploadLimit being ignored when not using proxy.nginxServerConfig
- Improve messages shown when container has no ip address

## 1.4.4 - April 2, 2018
- Allow customizing the docker image created during Prepare Bundle. For example, this can be used to install packages using apt-get.
- `mup status` will check if the default shell is bash
- Orup will exit when a hook script fails
- Fix running `mup restart`
- Fix passing arguments to `docker logs` when they are in the format `--option=value` instead of `--option value`
- Fix the validation error that the port is ignored showing when it shouldn't
- Fix loading plugins when given the path to the plugin instead of the plugin's name

**Docs**
- Move plugin documentation to seperate page
- Improve Let's Encrypt documentation
- Rename the `meteor` property to `app` in all of the examples
- Fix links in the getting started tutorial
- Many small improvements to the content and wording

## 1.4.3 - March 5, 2018
- Support different settings.json for different servers (@Farkal)
- `mup validate` shows message when config is valid
- Fix crash when the `app` property exists in the config, but `app.path` is missing.
- The `Prepare Bundle` task is now only shown when `Prepare Bundle` is enabled
- Hide `No such container` errors in the script for Prepare Bundle since they are normal and could cause confusion on what caused the script to fail
- Add validation warning when using the built-in mongo and the MONGO_URL looks like it is for an external database
- Improve error messages when a config or plugin is unable to import a module
- Fix postinstall script for windows

**Plugins**
- Improve error message when an executeScript task has an invalid script path
- The config supplied to validator functions now has a `_origionalConfig` property, with the config before it was normalized or prepared by plugins
- Fix the meteor plugin preparing the config when the app type isn't `meteor`
- Fix validator utils `addLocation` ending location with a period when a detail's path is empty

## 1.4.2 - February 21, 2018

- Fix `Start Meteor` task always succeeding despite errors starting the app when using `Prepare Bundle`
- Fix `Verifying Deployment` when `app.env.PORT` is set
- Fix `Verifying Deployment` when using the host network
- Fix `proxy.setup` when running `mup setup` for the first time
- Fix `app.docker.imagePort` documentation

**Plugins**
- Add `pluginApi.commandHistory` to check which commands have run

## 1.4.1 - February 20, 2018

- Add additional logging to the Verifying Deployment script

## 1.4 - February 19, 2018

**Status**
The `mup status` command gives an overview of what is running on the servers and shows any problems plugins detected.

**Reverse Proxy**
- The reverse proxy is no longer an "experimental feature"
- Add support for customizing the generated nginx config
- Add `mup proxy nginx-config` command to view the generated config
- `HTTP_FORWARDED_COUNT` defaults to 1 when using the reverse proxy (@jehartzog)
- Fix verifying deployment when using the reverse proxy.
- Fix deploying when `app.env.PORT` is set to a value other than 80
- Fix setting up proxy when using a non-root user

**Mongo**
- Oplog is automatically enabled. To use, set `app.env.MONGO_OPLOG_URL` to `mongodb://mongodb/local` (@edemaine)
- The `Start Mongo` task now waits until mongo has sucessfully started before finishing
- If mongo fails to start, the `Start Mongo` task will now fail

**Depreciations**

`meteor.ssl`, `meteor.nginx`, and `meteor.docker.imageFrontendServer` are depreciated. It uses a different implementation for custom certificates and lets encrypt, each with different features and restrictions. Also, the custom certificate implementation has security problems. The reverse proxy should be used instead. It doesn't have the security problems, uses the same implementation for custom certificates and lets encrypt, and has many additional features. Learn how to use the [reverse proxy in the docs](http://meteor-up.com/docs#reverse-proxy).

`proxy.shared.clientUploadLimit` is depreciated. Use `proxy.clientUploadLimit` instead, which allows each app to have a different value.

**Other Changes**
- `mup init` will create a `.deploy` folder when run in the same folder as a Meteor app
- When mup can find a meteor app near to where `mup init` is run, the default config's `app.path` will be the path to that app
- When a deploy fails, the last 200 instead of 100 lines of the app's logs are shown
- More of the output is shown when a command fails
- When copying a file fails with the error `No such file`, it will tell the user to run `mup setup` to fix it
- `reconfig` hooks will now run during `mup deploy`
- `--show` is no longer needed to show the config when `mup validate --scrub` is run
- Add section to readme about Meteor compatibility
- Initial work has been done to support Docker Swarm
- When there is only one server, `mup ssh` will not require the name of a server
- Add `zodern/meteor` to list of images that Prepare Bundle is automatically enabled for
- If the app's docker container is restarting during 10 checks, the Deployment Verifier will revert the app without waiting the full time in `deployCheckWaitTime`
- Some of Orup's dependencies use Buffer.alloc. When the version of node used to run mup is missing the function, mup will show a message explaining the problem and exit
- Added 10 second timeout to the curl command in the Deployment Verifier
- Fix retry logic for the copy file task
- Fix `mup restart` and `mup meteor restart` when config has an `app` object instead of `meteor`
- Fix running Prepare Bundle when image already has a `/built_app` folder
- Fix alignment of list of servers when running `mup ssh` without specifying a server
- Fix showing stack trace of errors with old versions of Node
- Fix plugins preparing the config multiple times
- Fix loading locally installed plugins
- `npm install` will still succeed even if Open Collectives's post-install hook fails

**Docs**
- Document using a private docker registry (@justinr1234)
- Document `HTTP_FORWARDED_COUNT` (@jehartzog)
- Change `app.buildOptions.debug` to `false` in example configs
- Add section to readme about changing the docker image
- Add the [`zodern:meteor`](https://github.com/zodern/meteor-docker) image to list of docker images
- Improve the style of tables in the docs

**Plugins**
- list.executeScript supports server specific variables
- Using the `post.status` hook, plugins can show their status
- Plugins can add a `solution` property to errors. Mup will show the solution in yellow before exiting
- Plugins can add a depreciation warning while validating a config with `utils.addDepreciation`
- Validator utils support joi v11, v12, and v13 in addition to joi v10.

## 1.3.7 - Nov 28, 2017

- Fix permission denied error sometimes encountered during Prepare Bundle

## 1.3.6 - Nov 24, 2017

- Fix permission denied errors when deploying to nonroot user (@nickich)
- Make bundle portable (@m-niesluchow)

## 1.3.5 - Nov 3, 2017
- Fix tar errors
- The validation message shown when the `servers` object is missing from the config has been removed since some deployment plugins might not need it
- The config created by `mup init` has the correct docker image for Meteor 1.6
- Add table to docs that shows which docker image to use for each Meteor version

**Plugins**
- The remaining Meteor functionality has been removed from the default plugin, allowing plugins to completely take over deploying and managing the app when `app.type` in the config is set to something besides `meteor`

## 1.3.4 - October 4, 2017
- The exit code for `mup validate` is now 1 when there are validation errors
- Fix changing proxy's clientUploadLimit with `proxy.shared.clientUploadLimit`
- Added a `--scrub` option to `mup validate`, which when used with `--show` shows the config with most of the sensitive information removed
- `mup mongo logs` accepts the same options as `mup logs` and other log commands
- Use npm-shrinkwrap to prevent https://github.com/zodern/meteor-up/issues/757 from happening again
- Hide docker error when trying to roll back and checking if an image exists. It is handled and normal, but could be confused with the reason for the app failing to start

**Plugins and Hooks**
- Building the app (but not archiving it) was moved to a new command `meteor.build`, which is run by `meteor.deploy` and `meteor.push`. This allows plugins or hooks to modify the bundle before it is archived and uploaded to the servers.
- Plugins can export a `scrubConfig(config, utils)` function, which should return the config with all sensitive information removed
- `api.scrubConfig()` was added, which returns the config after modified by any `scrubConfig` functions from plugins
- `api.validateConfig` only shows the errors on the console the first time it is run
- `MODULE_NOT_FOUND` errors are now shown when a plugin fails to load due to being unable to resolve a module

**Docs**
- Color, font, and spacing changes were made to the docs. It should look nicer and be easier to read.
- Fixed grammar and capitalization
- Many example configs in the docs are validated with `mup validate`
- Many example configs show more of the config surrounding the section being documented

## 1.3.3 - September 12, 2017
- Add `mup validate` command, which validates the config. Has `--show` option which shows the config after it has been normalized and modified by plugin's `prepareConfig` functions
- Add `mup proxy logs-le` to view the Let's Encrypt logs
- Fix mup ignoring `app.dockerImage` in the config when using Mongo, the reverse proxy, or Redis
- Fix error encountered during Verifying SSL Certificates after it had failed previously due to a docker container still running
- Give more details when unable to load settings.json

## 1.3.2 - September 8, 2017
- App's env variables are set before `npm install` during Prepare Bundle
- Fix error sometimes encountered when starting app after updating Mup to 1.3
- Periods are removed from the database name when using built-in MongoDB
- Removed validation error `"meteor.name" has a period`
- Fix Prepare Bundle when app name has uppercase letters
- Fix reverse proxy's let's encrypt and force ssl not working when `app.env` is missing
- Fix crash when `app.name` is missing

## 1.3.1 - August 23, 2017
- Add `mup ssh <server>` command
- Exit code when task list fails is now 1 instead of 0
- Fix deploying when server's default shell is zsh @thsowers
- All docker commands are run with `sudo`
- `mup proxy stop` doesn't require the `proxy` object to be in the config
- Add option `app.docker.prepareBundle` to enable or disable prepare bundle

## 1.3.0 - August 22, 2017

**Hooks**

It is now possible to add hooks that run before or after commands. The new `--show-hook-names` option shows all of the available hooks for a cli command while it is running. Hooks can be a command to run locally or on the servers, or a function.

**Plugins**

Plugins are npm packages that can add commands (commands can be run from the mup cli or by other plugins), hooks, and config validators. All of the included cli commands and task lists have been moved to plugins.

**Changes to Deployment and Deployment validation**

*This is currently only enabled for the `abernix/meteord` docker image.*

After the bundle is uploaded to each server, a new task is run called "Prepare bundle". It installs the Meteor npm dependencies, rebuilds native modules, and stores the result in a docker image. This has a few benefits:
- The time in `meteor.deployCheckWaitTime` no longer needs to include the time to install npm dependencies
- When installing dependencies fails, it does not continuously restart until `meteor.deployCheckWaitTime` expires, and running with `--verbose` shows the full logs from `npm install`
- Dependencies are only installed once during each deploy. This means that `mup start`, `mup restart`, and `mup reconfig` are all much faster.

**Improved Support for Multiple Servers**
- `mup restart` restarts only one server at a time
- Add `--servers` option to list which servers to use
- Add support for server specific env variables, which can be configured in `meteor.servers.<server name>.env`

**Config Changes**
- The `meteor` object has been renamed to `app`. The `meteor` object will be supported until Mup 2.0
- You can remove `mongo.port` and `mongo.oplog` from your config since they have never been used

**Docs**
- Remove `meteor.docker.imagePort`, `mongo.port`, and `mongo.oplog` from example configs
- Document `meteor.docker.imagePort`
- Update documentation for `meteor.deployCheckWaitTime`
- Improve mongo, migration, proxy, and troubleshooting docs

**Other Changes**
- The reverse proxy can redirect `http` to `https`, configured with `proxy.ssl.forceSSL`
- `mup setup` updates Docker if it is older than 1.13
- Add `mup proxy reconfig-shared` to update the server after changing `proxy.shared` in the config.
- Remove `meteor.deployCheckWaitTime`, `meteor.docker.imagePort`, and `mongo.port` from default config
- Renamed the `meteor` object in the default config to `app`
- Improve cli help output (commands have a description, command specific options are documented)
- Show link to docs when there are validation errors
- Show validation error when `server.pem` is a path to a public key
- Show validation error when `app.name` has a period
- Improve some of the validation messages
- Fix validating `proxy.shared.clientUploadLimit`
- Mup displays message and exits if the node version is older than v4
- Remove unnecessary stack traces when the app's path is incorrect or `meteor build` fails
- Add `mup meteor restart` command
- Remove `mup mongo dump` command since it did nothing

## 1.2.11 - June 14, 2017
- Deployment verifier shows last 100 lines of the app's log when it fails (it previously was 50 lines)
- Fix `mup setup` restarting docker

## 1.2.10 - June 4, 2017
- Deployment verifier no longer requires the http status code to be 200.

## 1.2.9 - June 3, 2017
- Add shared nginx proxy
    - Is configured with a `proxy` object instead of using `meteor.ssl` and `meteor.nginx`
    - If multiple apps are deployed to a server, routes requests to the correct container
    - Adds `mup proxy` command. For a list of subcommands, run `mup proxy help`
    - Supports using custom certificates. This should be used instead of `meteor.ssl` since the previous image used for custom certificates had a security vulnerability.
    - Also can set up Let's Encrypt
    - Supports configuring the env variables for the nginx and let's encrypt containers.

Big thanks to @shaiamir for his work on the shared proxy.

- `mup stop` also stops nginx proxy and let's encrypt containers
- App inside container's port is set to `docker.imagePort`. The app is still accessible on `env.PORT`.
- Will build app if cached build is not found and `--cached-build` flag is set
- Fix some bugs with verifying deployment
- Add support for `zodern:mup-helpers` package. Since version 1.2.7, verifying deployment fails if the app's `/` route's http code is other than 200, or if it does not redirect on the server to a page that does have that http code. Adding `zodern:mup-helpers` allows meteor up to successfully validate the deployment.

## 1.2.7 - May 5, 2017
- Fix verifying deployment when using ssl autogenerate
- Add default host to nginx-proxy to redirect unknown hosts to the app when accessed over http
- Remove `force-ssl` warning and add a note about redirects to the Troubleshooting guide in the readme
- Fix example config in readme @meteorplus
- Fix setting `HTTPS_METHOD` for nginx-proxy. It will no longer redirect http to https
- Validator warns when using ssl autogenerate and setting `env.PORT`.

## 1.2.6 - March 29, 2017
- Fix `force-ssl` warning appearing when ssl is setup correctly

## 1.2.5 - March 22, 2017
- Support changing docker exposed port @abernix
- New `mup docker restart` command
- New `mup docker ps` command. It accepts all arguments that `docker ps` accepts
- Old ssh key and bundle are deleted before uploading new ones
- Setting up Mongo and Meteor are no longer in parallel
- `--verbose` flag also shows output from scripts run on the server
- MongoDB is safely shutdown for `Start Mongo` and `Stop Mongo` task lists
- Reduced number of dependencies installed
- Better error message on meteor build spawn error
- Setup tasks are consistently capitalized
- Clearer validator message for `ROOT_URL`
- Add warning message when using `force-ssl` without ssl setup
- Validate `meteor.ssl.upload` @markreid

## 1.2.4 - March 13, 2017
- Add tips to default config, and comment what needs to be changed
- `mup init` and `mup setup` suggests what to do next
- Startup script is updated during `mup reconfig`
- Default build path is consistent between deploys for each app
- Add `--cached-build` flag to `mup deploy` which uses the build from the previous deploy
- Configure additional docker networks, ip binding, and verification port @giordanocardillo
- Add `--verbose` flag to show output from `meteor build`
- Handles promise rejections
- Fix docker not always disconnecting containers from networks @joaolboing
- Fix stderr sometimes in wrong place in logs
- Fix some lines in logs would be missing the host name
- Fix validating buildLocation
- Fix path to temp folder on Windows

## 1.2.3 - March 4, 2017
- Default config uses meteor.docker object instead of dockerImage @maxmatthews
- Docker args from config are no longer escaped @maxmathews
- Add buildLocation for validator @stubbegianni
- Improved messages from validator
- Fix nginx-proxy not starting on server restart
- Fix documentation on changing port @maxmathews

## 1.2.2 - Feb 11, 2017
- Configure nginx max client upload size, and increase default to `10M` (@shadowcodex)
- Displays better message if it can not find the meteor app
- Displays message if can not find pem for server
- Improve validating server's `host` in config
- Validator checks for `http://` or `https://` in `ROOT_URL`
- Update documentation on using `mup` on Windows

## 1.2.1 - Feb 8, 2017
- All paths support "~"
- Add `server` and `allowIncompatibleUpdates` to build config (@alvelig)
- Allow `mobile-settings` build option to use `settings.json` file (@alvelig)
- Add `mup --version` command
- Fix validating env `variables` and `imageFrontendServer`

## 1.2.0 - Feb 7, 2017
- Support Meteor 1.4 by default (@ffxsam)
- Change mongo version
- Validates `mup.js` and displays problems found in it
- Update message is clearer and more colorful
- `uploadProgressBar` is part of default `mup.js`
- Add trailing commas to mup.js (@ffxsam)
- Improve message when settings.json is not found or is invalid
- Loads and parses settings.json before building the app
- Improve message when given unknown command
- Fix switching from auto-generated ssl certificates to upload certificates
- Fix `Error: Cannot find module 'ssh2'`
- Fix `mup logs` when using custom configuration or settings files

## 1.1.2 - Feb 4, 2017
- Fixed `mup setup` when using let's encrypt

## 1.1.1 - Feb 4, 2017
- Fixed some files had windows line endings

## 1.1 - Feb 4, 2017
- Add let's encrypt support (@mbabauer)
- Fix typo (@timbrandin)
- Help is shown for `mup` and `mup help`
- Improved help text
