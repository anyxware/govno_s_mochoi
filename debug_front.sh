#!/bin/bash

echo "y" | docker container prune 
cd frontend && docker build -t krasnikova-frontend:latest .
docker run -p 3000:3000 krasnikova-frontend