#!/bin/bash

docker network create frontend_network
docker network create backend_network

docker run -d --name database --network backend_network mongo:latest
docker build -t backend ./backend
docker run -d --name backend --network backend_network -p 3000:3000 backend

docker build -t frontend ./frontend
docker run --name frontend --network frontend_network -p 80:80 frontend

docker network connect frontend_network backend

echo "aplikacja działa"