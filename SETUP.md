# GradeUp - Setup Guide

## Complete Installation Instructions

This guide will help you set up and run the GradeUp examination platform from scratch.

---

## Step 1: Prerequisites

### Software Requirements
- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **MySQL 8.0+** - [Download](https://dev.mysql.com/downloads/mysql/)
- **Git** (optional) - [Download](https://git-scm.com/)

### Verify Installation
```bash
python --version   # Should show 3.8 or higher
node --version     # Should show 16 or higher
mysql --version    # Should show 8.0 or higher
```

---

## Step 2: Database Configuration

### Create Database
1. Open MySQL Command Line or MySQL Workbench
2. Run the following command:
```sql
CREATE DATABASE gradeup_lite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Verify Database Creation
```sql
SHOW DATABASES;
-- You should see gradeup_lite in the list
```

---

## Step 3: Backend Setup

### Install Python Dependencies
```bash
# Navigate to backend directory
cd backend

# Install required packages
pip install -r requirements.txt
```

### Configure Database Connection (if needed)
Edit `backend/database.py` and update the connection string:
```python
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://username:password@localhost/gradeup_lite"
```

Replace `username` and `password` with your MySQL credentials.

---

## Step 4: Frontend Setup

### Install Node Modules
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

---

## Step 5: Initial Database Seeding

Create an initial admin user by running Python in the backend directory:

```bash
cd backend
python
```

Then in the Python shell:
```python
from database import SessionLocal
from models import User, UserRole
from routers.auth import get_password_hash

db = SessionLocal()

# Create admin user
admin = User(
    username="AdminUser",
    email="admin@gradeup.com",
    hashed_password=get_password_hash("admin123"),
    role=UserRole.ADMIN
)
db.add(admin)
db.commit()
print("Admin user created!")
exit()
```

---

## Step 6: Running the Application

### Terminal 1: Start Backend Server
```bash
cd backend
uvicorn main:app --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Terminal 2: Start Frontend Development Server
```bash
cd frontend
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

---

## Step 7: Access the Application

1. Open your browser
2. Navigate to: `http://localhost:5173`
3. Login with admin credentials:
   - **Username:** `AdminUser`
   - **Password:** `admin123`

---

## API Documentation

Backend API documentation is available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## Troubleshooting

### Backend Won't Start

**Error: "Unknown database 'gradeup_lite'"**
- Solution: Create the database using Step 2

**Error: "Can't connect to MySQL server"**
- Solution: Ensure MySQL is running
- Windows: Check Services (services.msc)
- Mac/Linux: `sudo systemctl status mysql`

**Error: "Access denied for user"**
- Solution: Check MySQL credentials in `backend/database.py`

### Frontend Won't Start

**Error: "Cannot find module"**
- Solution: Delete `node_modules` and run `npm install` again

**Error: "Port 5173 is already in use"**
- Solution: Kill the process or use a different port:
  ```bash
  npm run dev -- --port 3000
  ```

### Frontend Can't Connect to Backend

**Error: "Network Error" or "CORS"**
- Verify backend is running on port 8000
- Check `frontend/src/api.js` - should have `baseURL: 'http://localhost:8000'`
- Clear browser cache and reload

### Database Tables Not Created

The application automatically creates tables on first startup. If tables are missing:

```python
# Run in backend directory
python
>>> from database import engine
>>> from models import Base
>>> Base.metadata.create_all(bind=engine)
>>> exit()
```

---

## Project Structure Overview

```
GradeUp/
├── backend/
│   ├── routers/
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── users.py         # User management
│   │   ├── questions.py     # Question management
│   │   ├── exams.py         # Exam scheduling
│   │   ├── exams_student.py # Student exam operations
│   │   └── admin.py         # Admin operations
│   ├── models.py            # Database models
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # Database configuration
│   ├── main.py             # FastAPI application
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # React components
│   │   ├── context/        # Authentication context
│   │   ├── api.js         # Axios configuration
│   │   └── main.jsx       # Entry point
│   ├── package.json        # Node dependencies
│   └── index.html         # HTML template
│
├── README.md              # Project overview
├── SETUP.md              # This file
└── .gitignore            # Git ignore rules
```

---

## Usage Workflow

1. **Admin** logs in and approves teacher question sets
2. **Admin** schedules exams using approved question sets
3. **Students** register and take scheduled exams
4. **System** automatically grades and shows results
5. **Admin** monitors active exams in real-time

---

## Additional Resources

- **Bengali Documentation**: See `PROJECT_DESCRIPTION_BANGLA.md`
- **API Endpoints**: `http://localhost:8000/docs`
- **Database Schema**: Defined in `backend/models.py`

---

## Next Steps

After successful setup:
1. Create teacher accounts via admin panel
2. Teachers create question sets
3. Admin approves question sets
4. Admin schedules exams
5. Students take exams

Enjoy using GradeUp! 🎓
