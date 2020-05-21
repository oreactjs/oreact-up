# Oreact Up 

#### Production Quality Oreact Deployments

Oreact Up is a command line tool that allows you to deploy any [Oreact](http://oreactjs.com) app to your own server.

You can install and use Oreact Up on Linux, Mac and Windows. It can deploy to servers running Ubuntu 14 or newer.

This version of Oreact Up is powered by [Docker](http://www.docker.com/), making deployment easy to manage and reducing server specific errors.


### Features

* Single command server setup
* Single command deployment
* Deploy to multiple servers
* Environment Variable management
* Password or Private Key (pem) based server authentication
* Access logs from the terminal (supports log tailing)
* Support for custom docker images
* Support for Let's Encrypt and custom SSL certificates

### Server Configuration

* Auto-restart if the app crashes
* Auto-start after server reboot
* Runs with docker for better security and isolation
* Reverts to the previous version if the deployment failed
* Pre-installed PhantomJS

### Installation

Oreact Up requires Node v4 or newer. It runs on Windows, Mac, and Windows.

```bash
npm install -g orup
```

`orup` should be installed on the computer you are deploying from.