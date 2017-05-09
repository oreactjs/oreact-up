#!/bin/bash

APPNAME=<%= appName %>
CLIENTSIZE=<%= nginxClientUploadLimit %>
APP_PATH=/opt/$APPNAME
BUNDLE_PATH=$APP_PATH/current
ENV_FILE=$APP_PATH/config/env.list
PORT=<%= port %>
BIND=<%= bind %>
NGINX_PROXY_VERSION=latest
LETS_ENCRYPT_VERSION=latest

# Remove previous version of the app, if exists
docker rm -f $APPNAME

# Remove container network if still exists
docker network disconnect bridge -f $APPNAME
<% for(var network in docker.networks) { %>
docker network disconnect <%=  docker.networks[network] %> -f $APPNAME

<% } %>

# Remove frontend container if exists
docker rm -f $APPNAME-frontend
docker network disconnect bridge -f $APPNAME-frontend
echo "Removed $APPNAME-frontend"


# Remove let's encrypt containers if exists
docker rm -f $APPNAME-nginx-letsencrypt
docker network disconnect bridge -f $APPNAME-nginx-letsencrypt
echo "Removed $APPNAME-nginx-letsencrypt"

docker rm -f $APPNAME-nginx-proxy
docker network disconnect bridge -f $APPNAME-nginx-proxy
echo "Removed $APPNAME-nginx-proxy"

# We don't need to fail the deployment because of a docker hub downtime
set +e
docker pull <%= docker.image %>
set -e
echo "Pulled <%= docker.image %>"

docker run \
  -d \
  --restart=always \
  <% if((sslConfig && typeof sslConfig.autogenerate === "object") || (typeof nginxConfig === "object" && nginxConfig.domains))  { %> \
  --expose=80 \
  <% } else { %> \
  --publish=$BIND:$PORT:<%= docker.imagePort %> \
  <% } %> \
  --volume=$BUNDLE_PATH:/bundle \
  --hostname="$HOSTNAME-$APPNAME" \
  --env-file=$ENV_FILE \
  <% if(useLocalMongo)  { %>--link=mongodb:mongodb --env=MONGO_URL=mongodb://mongodb:27017/$APPNAME <% } %>\
  <% if(logConfig && logConfig.driver)  { %>--log-driver=<%= logConfig.driver %> <% } %>\
  <% for(var option in logConfig.opts) { %>--log-opt <%= option %>=<%= logConfig.opts[option] %> <% } %>\
  <% for(var volume in volumes) { %>-v <%= volume %>:<%= volumes[volume] %> <% } %>\
  <% for(var args in docker.args) { %> <%- docker.args[args] %> <% } %>\
  <% if(sslConfig && typeof sslConfig.autogenerate === "object")  { %> \
    -e "VIRTUAL_HOST=<%= sslConfig.autogenerate.domains %>" \
    -e "LETSENCRYPT_HOST=<%= sslConfig.autogenerate.domains %>" \
    -e "LETSENCRYPT_EMAIL=<%= sslConfig.autogenerate.email %>" \
    -e "HTTPS_METHOD=noredirect" \
  <% } else if(typeof nginxConfig === "object" && nginxConfig.domains) { %> \
    -e "VIRTUAL_HOST=<%= nginxConfig.domains %>" \
  <% } %> \
  --name=$APPNAME \
  <%= docker.image %>
echo "Ran <%= docker.image %>"
sleep 15s

<% if(typeof sslConfig === "object") { %>
   <% if(typeof sslConfig.autogenerate === "object")  { %>
    echo "Running autogenerate"
    # Get the nginx template for nginx-gen
    wget https://raw.githubusercontent.com/jwilder/nginx-proxy/master/nginx.tmpl -O /opt/$APPNAME/config/nginx.tmpl

    # Update nginx config based on user input or default passed by js
sudo cat <<EOT > /opt/$APPNAME/config/nginx-default.conf
client_max_body_size $CLIENTSIZE;
EOT


    # We don't need to fail the deployment because of a docker hub downtime
    set +e
    docker pull jrcs/letsencrypt-nginx-proxy-companion:$LETS_ENCRYPT_VERSION
    docker pull jwilder/nginx-proxy:$NGINX_PROXY_VERSION
    set -e

    echo "Pulled autogenerate images"
    docker run -d -p 80:80 -p 443:443 \
      --name $APPNAME-nginx-proxy \
      --restart=always \
      -e "DEFAULT_HOST=<%= sslConfig.autogenerate.domains.split(',')[0] %>" \
      -v /opt/$APPNAME/config/nginx-default.conf:/etc/nginx/conf.d/my_proxy.conf:ro \
      -v /opt/$APPNAME/certs:/etc/nginx/certs:ro \
      -v /opt/$APPNAME/config/vhost.d:/etc/nginx/vhost.d \
      -v /opt/$APPNAME/config/html:/usr/share/nginx/html \
      -v /var/run/docker.sock:/tmp/docker.sock:ro \
      jwilder/nginx-proxy:$NGINX_PROXY_VERSION
      echo "Ran nginx-proxy"
    sleep 15s

    docker run -d \
      --name $APPNAME-nginx-letsencrypt \
      --restart=always\
      --volumes-from $APPNAME-nginx-proxy \
      -v /opt/$APPNAME/certs:/etc/nginx/certs:rw \
      -v /var/run/docker.sock:/var/run/docker.sock:ro \
      jrcs/letsencrypt-nginx-proxy-companion:$LETS_ENCRYPT_VERSION
    echo "Ran jrcs/letsencrypt-nginx-proxy-companion"
    <% } else { %>
      # Using shared nginx so just copy the cert files to the right place.
    <% if(typeof nginxConfig === "object"  && nginxConfig.domains)  { %>
      <% var domainsArr=nginxConfig.domains.split(','); for(var i=0; i<domainsArr.length; i++) { %>
        cp /opt/$APPNAME/config/bundle.crt /opt/<%= nginxConfig.name %>/certs/<%= domainsArr[i] %>.crt
        cp /opt/$APPNAME/config/private.key /opt/<%= nginxConfig.name %>/certs/<%= domainsArr[i] %>.key
      <% } %>
    <% } else { %>
    # We don't need to fail the deployment because of a docker hub downtime
    set +e
    docker pull <%= docker.imageFrontendServer %>
    set -e
    docker run \
      -d \
      --restart=always \
      --volume=/opt/$APPNAME/config/bundle.crt:/bundle.crt \
      --volume=/opt/$APPNAME/config/private.key:/private.key \
      --link=$APPNAME:backend \
      --publish=$BIND:<%= sslConfig.port %>:443 \
      --name=$APPNAME-frontend \
      <%= docker.imageFrontendServer %> /start.sh
  <% } %>
<% } %>
<% } %>

<% for(var network in docker.networks) { %>
docker network connect <%=  docker.networks[network] %> $APPNAME

<% } %>
