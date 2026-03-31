# Project Technical Documentation
## User Management System with Capability & Franchise Hierarchy

---

# 1. Project Overview

This project is a full-stack web application built using:

Frontend:
- React.js
- Axios
- Bootstrap

Backend:
- Node.js
- Express.js
- JWT Authentication
- Repository Pattern
- JSON File-Based Storage

Development Ports:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

# 2. System Architecture

The application follows a layered architecture:

Route → Controller → Repository → Data Source (JSON files)

Frontend communicates with backend via REST APIs.
JWT is used for secure authentication.

---

# 3. Folder Structure

## Backend Structure

backend/
│
├── server.js
│
├── data/
│   ├── users.json
│   ├── capabilities.json
│   ├── franchises.json
│   ├── recognitions.json
│   └── events.json
│
├── uploads/
│
└── src/
    ├── routes/
    │   ├── authRoutes.js
    │   ├── userRoutes.js
    │   ├── franchiseRoutes.js
    │   ├── capabilityRoutes.js
    │   ├── dashboardRoutes.js
    │   ├── leadershipRoutes.js
    │   ├── eventRoutes.js
    │   └── recognitionRoutes.js
    │
    ├── controllers/
    │   ├── authController.js
    │   ├── userController.js
    │   ├── franchiseController.js
    │   ├── capabilityController.js
    │   └── ...
    │
    ├── repositories/
    │   ├── userRepository.js
    │   ├── franchiseRepository.js
    │   ├── capabilityRepository.js
    │   └── ...
    │
    └── middleware/
        ├── authMiddleware.js
        └── ...

---

## Frontend Structure

frontend/
│
├── public/
│
└── src/
    ├── pages/
    │   ├── admin/
    │   │   ├── UserPage.jsx
    │   │   ├── FranchisePage.jsx
    │   │   └── ...
    │
    ├── features/
    │   ├── users/
    │   │   ├── UserForm.jsx
    │   │   └── userService.js
    │   │
    │   ├── franchises/
    │   │   └── franchiseService.js
    │
    ├── services/
    │   └── api.js
    │
    ├── utils/
    │   ├── roleUtils.js
    │   └── tokenUtils.js
    │
    └── constants/
        └── roles.js

---

# 4. Authentication Flow

1. User logs in via:
   POST /api/login

2. Backend returns JWT token.

3. Token is stored in localStorage.

4. Axios interceptor attaches token automatically:

   Authorization: Bearer <token>

5. Protected routes verify token using authMiddleware.

---

# 5. Capability → Franchise → User Flow

## Step 1: Load Capabilities
Frontend:
GET /api/capabilities

Backend:
capabilityRoutes → capabilityController → capabilityRepository

---

## Step 2: Load Franchises Based on Capability

Frontend:
GET /api/franchises/filter?capabilityId=<id>

Backend:
franchiseRoutes → franchiseController.getFranchisesByCapability()

Repository Logic:
franchises.filter(f => f.capabilityId === capabilityId)

---

## Step 3: Create User

Frontend sends multipart/form-data:
POST /api/users

Data includes:
- firstName
- lastName
- username
- password
- capabilityId
- franchiseId
- profilePic
- etc.

Backend:
userRoutes → userController → userRepository

---

# 6. API Endpoints Overview

Authentication:
POST   /api/login

Users:
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

Capabilities:
GET    /api/capabilities

Franchises:
GET    /api/franchises
GET    /api/franchises/filter?capabilityId=
POST   /api/franchises
PUT    /api/franchises/:id
DELETE /api/franchises/:id

Recognition:
GET    /api/recognition
POST   /api/recognition

Events:
GET    /api/events
POST   /api/events

---

# 7. Security

- JWT Authentication
- Protected API Routes
- Authorization Header Validation
- CORS Enabled
- Static Upload Folder Protection

---

# 8. Design Patterns Used

- Repository Pattern
- Layered Architecture
- Feature-Based Frontend Structure
- RESTful API Design
- Axios Interceptor Pattern

---

# 9. Current Features Implemented

- User Management
- Role-Based Access
- Capability Management
- Franchise Filtering by Capability
- File Upload Support
- Recognition Module
- Event Module
- Dashboard Module

---

# 10. Future Improvements

- Replace JSON with MongoDB or MySQL
- Add Pagination
- Add Search & Sorting
- Add Role-Based Backend Authorization
- Deploy to Production (Docker / Cloud)

---

END OF DOCUMENT