# Lab 6: Docker & Microservices – CampusConnect

## Overview
Lab 5's single Dockerized `student-api` (Express + MongoDB) is split into three independently runnable services, each with its own code, Dockerfile, image, container and MongoDB database. User Service is the Lab 5 student API renamed to users.

![Architecture](architecture.svg)

## Services, Ports, Endpoints
| Service | Port | Endpoints | Database (owned) |
|---|---|---|---|
| user-service | 3001 | GET/POST `/users`, GET/PUT/DELETE `/users/{id}` | `user-db` / `userdb` |
| product-service | 3002 | GET/POST `/products`, GET/PUT/DELETE `/products/{id}` | `product-db` / `productdb` |
| order-service | 3003 | POST/GET `/orders`, GET `/orders/{id}` | `order-db` / `orderdb` |

IDs: users start at 101, products at 501, orders at 901.

## API & Communication Exercise
| Item | User Service | Product Service | Order Service |
|---|---|---|---|
| Responsibility | CRUD users (students), validate email/semester | CRUD products (name, category, price, stock) | Create/retrieve orders; validate user & product via REST; compute total |
| Port | :3001 | :3002 | :3003 |
| Main resources | Users | Products | Orders |
| Key endpoints | GET/POST/PUT/DELETE /users | GET/POST/PUT/DELETE /products | POST/GET /orders |
| Data/database | User-owned (`user-db`) | Product-owned (`product-db`) | Order-owned (`order-db`) |

| Field | Design |
|---|---|
| Calling service | Order Service |
| Target service | User Service / Product Service |
| HTTP method | GET |
| Endpoint | `/users/{id}`, `/products/{id}` |
| Request data | `userId` / `productId` from POST /orders body |
| Expected response | 200 + resource |
| Failure response | 404 invalid resource; 503 dependency unavailable/timeout |

## Run
```bash
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs
```
Build images individually:
```bash
docker build -t user-service:v1 ./user-service
docker build -t product-service:v1 ./product-service
docker build -t order-service:v1 ./order-service
```
Run one service without Docker: `cd user-service && cp .env.example .env && npm install && npm start` (needs a MongoDB).

## Dockerfile
`node:22-alpine` base → `WORKDIR /app` → copy `package*.json` and `npm install` (cached layer) → copy source → `EXPOSE` port → `CMD ["node","server.js"]`. `.dockerignore` excludes `node_modules` and `.env`.

## Networking & Configuration
All containers join the bridge network `campus-network`. Containers reach each other by Compose service name (`http://user-service:3001`, `mongodb://user-db:27017/userdb`), never `localhost`. Only the three APIs publish host ports; databases are internal.

Ports and URLs live in `.env` (no secrets): `USER_SERVICE_PORT`, `PRODUCT_SERVICE_PORT`, `ORDER_SERVICE_PORT`, `USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `REQUEST_TIMEOUT_MS`. Change a value and `docker compose up -d` — no code change.

## Database per Service
Each service connects only to its own Mongo container + named volume. Order Service stores `userId`/`productId` plus a snapshot (name, price) fetched over REST — it never touches `user-db`/`product-db`.

## Service-to-Service Flow & Error Handling
`POST /orders {"userId":101,"productId":501,"quantity":2}` →
order-service `GET http://user-service:3001/users/101` → `GET http://product-service:3002/products/501` → saves order → **201** (response includes the fetched `user` and `product`).

| Case | Result |
|---|---|
| user/product not found | 404 |
| dependency stopped / unreachable | 503 |
| dependency slower than `REQUEST_TIMEOUT_MS` | 503 (timeout) |
| dependency restarted | next request 201 (recovery) |

Retry, fallback and circuit breaker are conceptual only for this lab.

## Postman
Import `Microservices-Lab6.postman_collection.json` ("Microservices – Lab 6") and run folders in order. For folder 4 run `docker compose stop user-service` before the 503 test and `docker compose start user-service` before the recovery test.

| Test | Expected |
|---|---|
| GET /users, GET /products | 200 |
| POST /orders | 201 |
| Invalid user ID | 404 |
| Stop user-service → POST /orders | 503 |
| Restart → POST /orders | 201 |

## Troubleshooting
| Issue | Fix |
|---|---|
| `ECONNREFUSED 127.0.0.1` from order-service | use service names, not localhost |
| `ENOTFOUND user-service` | container stopped / not on `campus-network` |
| port already allocated | stop Lab 5 containers or change port in `.env` |
| stale code | `docker compose up -d --build` |
| reset data | `docker compose down -v` |
