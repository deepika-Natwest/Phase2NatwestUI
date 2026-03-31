# WEST-INFO
## Technical Architecture Documentation

---

# 1. Project Overview

**west-info** is a scalable web application consisting of:

- Public-facing React frontend
- React-based Admin Panel (same repository)
- Node.js + Express backend
- Temporary JSON file storage (planned migration to MongoDB)
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Bootstrap UI framework

The system is designed for long-term scalability while optimized for early-stage simplicity.

---

# 2. Technology Stack

## 2.1 Frontend

- Create React App (react-scripts 5.0.1)
- React 19
- React Router (CRA-compatible)
- Bootstrap
- Functional components + Hooks
- No Redux (unless required later)

## 2.2 Backend

- Node.js
- Express.js
- JSON file storage (temporary)
- bcrypt (password hashing)
- jsonwebtoken (JWT handling)
- Repository pattern (DB abstraction)

## 2.3 Future Migration

- MongoDB will replace JSON storage
- Only repository layer will change
- Controllers and services remain untouched

---

# 3. System Architecture

Frontend (React UI)
        ↓
REST API (Express Backend)
        ↓
Repository Layer
        ↓
JSON Storage (temporary)

Future:

Repository Layer
        ↓
MongoDB

---

# 4. Frontend Architecture

## Folder Structure

