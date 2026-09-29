# RESTful Web Services - Lab 3

This repository contains the solution for Lab 3, demonstrating RESTful Web Services implemented in both Express.js and Spring Boot.

## Structure

*   `student-api`: Contains the complete CRUD implementation using **Express.js**.
*   `student-api-spring`: Contains the equivalent GET and POST implementations using **Spring Boot**.
*   `RESTful_Web_Services_Lab_3.postman_collection.json`: Postman collection for testing the APIs.

---

## 1. Express.js API (Complete CRUD)

The Express.js implementation provides complete CRUD operations on a Student resource, using an in-memory data store.

### How to Run

1.  Open a terminal and navigate to the `student-api` directory:
    ```bash
    cd student-api
    ```
2.  Install dependencies (if not already installed):
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    node server.js
    ```
4.  The server will start on `http://localhost:3000`.

### OpenAPI / Swagger Documentation
You can access the interactive Swagger UI at:
`http://localhost:3000/api-docs`

---

## 2. Spring Boot API (GET and POST Equivalents)

The Spring Boot implementation uses the standard Controller -> Service -> Repository architecture. It implements the GET all, GET by ID, and POST endpoints.

### How to Run

1.  Open a terminal and navigate to the `student-api-spring` directory:
    ```bash
    cd student-api-spring
    ```
2.  Run the application using Maven Wrapper (if available) or standard Maven:
    ```bash
    mvn spring-boot:run
    ```
3.  The server will start on `http://localhost:8080`.

### OpenAPI / Swagger Documentation
Springdoc OpenAPI auto-generates the documentation. You can access the Swagger UI at:
`http://localhost:8080/swagger-ui.html`

---

## API Design Exercise

| Resource | Endpoint | Method | Request Body | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Student | `/students` | GET | — | 200 | 500 |
| Student | `/students/{id}` | GET | — | 200 | 404 |
| Student | `/students` | POST | Student JSON | 201 | 400 |
| Student | `/students/{id}` | PUT/PATCH | Student JSON | 200 | 400, 404 |
| Student | `/students/{id}` | DELETE | — | 204/200 | 404 |

**Explanation of RESTful Design Choices:**

1.  **Resource-Oriented Endpoints:** The endpoints use nouns (`/students`) instead of verbs (`/getStudents`, `/createStudent`). This adheres to REST principles where URLs identify the resource, and the HTTP method defines the action.
2.  **Appropriate HTTP Methods:**
    *   **GET:** Used to read data. It is safe and idempotent.
    *   **POST:** Used to create a new resource. It is not idempotent.
    *   **PUT/PATCH:** Used to update a resource (PUT for full, PATCH for partial).
    *   **DELETE:** Used to remove a resource.
3.  **Appropriate Status Codes:**
    *   **200 OK:** Standard success code for GET and successful updates.
    *   **201 Created:** Specific success code for POST, indicating a resource was created.
    *   **204 No Content:** Returned after a successful DELETE since there is no body to return.
    *   **400 Bad Request:** Returned when validation fails (e.g., missing name or negative semester).
    *   **404 Not Found:** Returned when operating on an ID that doesn't exist in the data store.
    *   **500 Internal Server Error:** Indicates a server-side exception.

---

## Testing

A Postman collection is included: `RESTful_Web_Services_Lab_3.postman_collection.json`. You can import this into Postman to test all endpoints. It includes:
*   Positive tests (valid GET, POST, PUT, PATCH, DELETE).
*   Negative tests (GET with invalid ID -> 404, POST with invalid body -> 400).
