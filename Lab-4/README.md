# Lab 4: Full-Stack Client & Database Integration

## Overview

This project fulfills the requirements of Lab 4 by building a full-stack system consisting of:
1. **Backend REST API**: Express.js with MongoDB Atlas for persistent storage.
2. **Web Client**: A React application for full CRUD operations.
3. **Mobile Client**: An Android application for List and Add operations.

## Architecture

![Architecture Diagram](https://dummyimage.com/600x400/000/fff&text=React+Web+%7C+Android+App+%2D%3E+REST+API+%2D%3E+MongoDB)

All client applications communicate with a single backend REST service, which is responsible for managing the connection to MongoDB Atlas.

### Why REST and not direct MongoDB access?
Connecting directly to MongoDB from the React or Android clients is generally a bad idea for several reasons:
1. **Security**: Direct access would require exposing database credentials to the client apps.
2. **Coupling**: The clients would be tightly coupled to the database schema. If the database structure changes, all clients must be updated.
3. **Validation logic**: A REST API acts as a central location to enforce business rules and validation, preventing clients from inserting bad data.

### Database Constraints
A **unique** constraint was added to the `email` field in the `Student` model (`models/Student.js`). This ensures that no two students can register with the same email, preserving data integrity.

## Setup & Run Instructions

### 1. Backend (Express.js)
1. Navigate to the API directory: `cd student-api`
2. Run `npm install` to install dependencies (express, mongoose, dotenv, cors, etc.).
3. Open the `.env` file and set your `MONGO_URI` to your MongoDB Atlas connection string.
4. Run the API: `npm run start` or `node server.js`
5. The API will start on `http://localhost:3000`.

### 2. React Client (Web)
1. Navigate to the client directory: `cd student-client`
2. Run `npm install` to install dependencies.
3. Ensure `.env` has `VITE_API_BASE_URL=http://localhost:3000`.
4. Start the dev server: `npm run dev`
5. Open your browser to the local URL (usually `http://localhost:5173`).

### 3. Android Client (Mobile)
1. Open the `student-android-client` folder in Android Studio.
2. Let Gradle sync and build the project.
3. The API base URL is hardcoded in `RetrofitClient.kt` as `http://10.0.2.2:3000/` for emulator access. Ensure your Express API is running.
4. Run the application on an Android Emulator.

## Reflection

Consuming the same REST API from both a web client (React) and a mobile client (Android) highlighted the strength of a Service-Oriented Architecture. The core API endpoints, JSON request/response shapes, and HTTP status codes (like 400 for validation errors and 404 for not found) remained exactly the same for both clients. What differed was the networking library (Axios vs. Retrofit), the base URL (`localhost` vs `10.0.2.2`), and the way UI feedback was presented (React state/alerts vs. Android Toasts), demonstrating how clients can remain fully decoupled from the backend implementation.
