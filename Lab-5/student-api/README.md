# Lab 5: Dockerizing the Lab 4 Student REST API

## Project Overview
This project continues from Lab 4 by containerizing the Student REST API and its MongoDB database. It demonstrates how to package a Node.js API with Docker, use Docker Networking for communication between containers, persist data via Docker Volumes, and orchestrate the environment using Docker Compose.

## Docker Installation & Verification
To verify your Docker installation, run:
```bash
docker --version
docker run hello-world
```

## Dockerfile Explanation
The `Dockerfile` defines the steps to package the Student API:
- `FROM node:20`: Uses the official Node.js 20 image.
- `WORKDIR /app`: Sets the working directory inside the container.
- `COPY package*.json ./`: Copies package files first to leverage caching.
- `RUN npm install`: Installs dependencies.
- `COPY . .`: Copies the remaining application code.
- `EXPOSE 3000`: Documents that the API listens on port 3000.
- `CMD ["npm", "start"]`: The command to start the application.

## Docker Image Build Command
Run this command in the directory containing the Dockerfile:
```bash
docker build -t student-api:v1 .
```

## Container Run and Port Mapping
To run the API container independently with port mapping:
```bash
docker run --name student-api -p 3000:3000 student-api:v1
```

## Postman API Testing
You can test the API using Postman. Ensure you target `http://localhost:3000`.
- `GET /students` - Retrieves all students
- `POST /students` - Creates a new student
- `PUT /students/{id}` - Updates a student
- `DELETE /students/{id}` - Deletes a student

## Docker Network Configuration
To allow standalone containers to communicate without hardcoding IPs:
```bash
docker network create student-network
docker network connect student-network mongodb
docker network connect student-network student-api
```

## Localhost vs MongoDB Service Name
Inside a Docker network, containers cannot use `localhost` to refer to one another (as `localhost` points to the container itself). We must use the MongoDB container/service name `mongodb` instead. Our Mongo URI becomes: `mongodb://mongodb:27017/campusconnect`

## Environment Variables
Environment variables (`PORT` and `MONGO_URI`) are injected into the API container. In `compose.yaml`:
```yaml
environment:
  PORT: 3000
  MONGO_URI: mongodb://mongodb:27017/campusconnect
```

## MongoDB Volume & Persistence Test
To persist data across container restarts:
```bash
docker volume create student-mongo-data
docker run -d --name mongodb -v student-mongo-data:/data/db mongo
```
If the container is removed and recreated using the same volume, the data remains intact.

## Docker Compose Configuration & Commands
`compose.yaml` defines both the `api` and `mongodb` services, their networks, and volumes.
To start the full environment:
```bash
docker compose up -d
```
To verify running services:
```bash
docker compose ps
```
To view logs:
```bash
docker compose logs
```
To stop and clean up:
```bash
docker compose down
```

## Troubleshooting
- **Address already in use**: Make sure no local processes (like a local Node server or local MongoDB) are bound to port 3000 or 27017 before starting Docker containers mapping to those ports.
- **Connection Error from API to Mongo**: Ensure the `MONGO_URI` correctly points to the `mongodb` service name, not `localhost`, and that both containers are attached to the same network.
