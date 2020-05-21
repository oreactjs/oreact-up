#!/bin/bash

# Disconnect node if part of a different cluster than the one orup is creating/managing
docker swarm leave || true
docker swarm join --token <%= token %> <%= managerIP %>
