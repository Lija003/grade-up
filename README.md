# GradeUp — Online MCQ Examination Platform

> A full-stack, role-based online examination system built for HSC students, teachers, and administrators.

---

## Technical Stack & Architecture

GradeUp is a modern web application separated into a RESTful API backend and a responsive Single Page Application (SPA) frontend.

### Frontend Technologies
* **Core**: React 18, Vite (for fast HMR and optimized builds)
* **Routing**: React Router DOM v7 (Client-side routing)
* **API Communication**: Axios (with centralized interceptors for JWT injection and error handling)
* **State Management**: React Context API (`AuthContext`, `NotificationContext`)
* **Styling**: Vanilla CSS with customized utility classes and CSS variables (no external CSS frameworks like Tailwind were used to maintain complete customizability).
* **Data Visualization**: Recharts (for Student analytics and Admin dashboards)
* **Icons**: Lucide-React

### Backend Technologies
* **Core Framework**: FastAPI (High performance, async-native Python web framework)
* **Language**: Python 3.10+
* **Database**: SQLite (Development) / MySQL (Production ready via `.env`)
* **ORM (Object Relational Mapper)**: SQLAlchemy 2.0 (Handling all database models, relations, and migrations)
* **Data Validation & Serialization**: Pydantic V2 (Tightly integrated with FastAPI for typed API requests/responses)
* **Authentication**: JWT (JSON Web Tokens) encoded via `python-jose`, passwords hashed with `passlib` (bcrypt).
* **Real-time Communication**: WebSockets (`fastapi.websockets`) - specifically used for real-time exam monitoring and live exam status updates.
* **Multipart Parsing**: `python-multipart` (For handling user avatars and question image uploads)

---

## Core Functionalities by Technology

### 1. Authentication & Security (JWT + bcrypt)
* Both the Frontend and Backend use a Bearer token verification system.
* On login, FastAPI generates an `access_token` signed with a secret key.
* The frontend stores this strictly in memory/local storage and attaches it to the `Authorization: Bearer <token>` header of every outgoing Axios request using an interceptor.

### 2. Live Exam Engine (React State + Backend Validation)
* When a student starts an exam, the frontend relies on React `useEffect` hooks and `setInterval` to manage a strict offline-resilient countdown timer.
* Responses are saved incrementally via the `/attempt/{id}/answer` endpoint. 
* Upon timer expiration, the frontend automatically fires the `/attempt/{id}/finish` POST request to lock the exam and calculate the score server-side.

### 3. Real-Time Admin Monitoring (WebSockets)
* Teachers and Admins can view live dashboards of ongoing exams.
* The React frontend establishes a `WebSocket` connection to the FastAPI `ws.py` endpoint.
* As students connect, disconnect, or progress through exams, lightweight JSON payloads are passed over the WebSocket to instantly update the Admin UI without polling the server.

### 4. File Upload System (FastAPI Static Files + React Input)
* Question embedded images and User Avatars are uploaded using standard `FormData`.
* The FastAPI backend receives the binary data, assigns a unique `UUID` filename, and writes it directly to the local filesystem (`backend/static/uploads/`).
* The frontend renders these images by referencing the static URL exposed by the backend (`http://localhost:8000/static/uploads/...`).

---

## Quick Start Setup Guide

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup & Virtual Environment

Navigate to the `backend` directory and set up an isolated Python environment. This ensures project dependencies don't conflict with your system Python.

```bash
cd backend

# Create a virtual environment named 'venv'
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

# Install the exact required dependencies
pip install -r requirements.txt
```

#### Managing Requirements (`requirements.txt`)
If you ever add new Python graphical libraries or tools (like `pip install pandas`), you must update the `requirements.txt` file so others can install them:
```bash
# Update requirements.txt with all currently installed packages
pip freeze > requirements.txt
```

### 2. Configure the Database
GradeUp runs perfectly out-of-the-box using a local SQLite database file, requiring zero database setup.

To start the server:
```bash
# Ensure your 'venv' is activated
uvicorn main:app --reload
```
Upon the *first boot*, SQLAlchemy will automatically create a `gradeup_demo.db` file and generate all tables.

### 3. Default SuperAdmin (Auto-Created)
When the backend starts for the first time, it automatically creates the root SuperAdmin account. **You do not need to register an admin manually.**

* **URL**: `http://localhost:5173/admin/login`
* **Username**: `admin`
* **Password**: `123`

### 4. Frontend Setup

Open a new terminal window (keep the backend running in the first one).

```bash
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## Role Features Matrix

| Feature | SuperAdmin | Admin | Teacher | Student |
|---------|------------|-------|---------|---------|
| Manage All Roles/Admins | ✅ | ❌ | ❌ | ❌ |
| Create Teachers & Students| ✅ | ✅ | ❌ | ❌ |
| Create Question Sets | ❌ | ❌ | ✅ | ❌ |
| Clone & Schedule Exams | ❌ | ❌ | ✅ | ❌ |
| Monitor Live Exams | ✅ | ✅ | ✅ | ❌ |
| Take Exams | ❌ | ❌ | ❌ | ✅ |
| Take Practice Exams | ❌ | ❌ | ❌ | ✅ |
| View Analytics | ❌ | ❌ | ✅ | ✅ |
| Global Leaderboard | ✅ | ✅ | ❌ | ✅ |

---

## Production Deployment Checklist

1. **Change the Secret Key**: Update the `SECRET_KEY` in `.env` to a secure, random string (e.g., generated via `openssl rand -hex 32`).
2. **Switch to MySQL/PostgreSQL**: Set the `DATABASE_URL` in `.env` to point to a robust relational database rather than SQLite.
3. **Build Frontend**: Run `npm run build` inside the `frontend` directory to generate the static HTML/JS bundle.
4. **Serve Backend**: Run FastAPI behind a production ASGI server like Gunicorn (`gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker`).
