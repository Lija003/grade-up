import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import models, database, config
from routers import auth, questions, exams, exams_student, users, ws, leaderboard, hierarchy, notifications
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("gradeup")

app = FastAPI(
    title="GradeUp API",
    description="Backend for GradeUp — Online MCQ Examination Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Ensure uploads directory exists
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS — allow all common dev ports; tighten to your domain in production
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler — prevents stack traces leaking to clients
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

# Include all routers
app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(exams.router)
app.include_router(exams_student.router)
app.include_router(users.router)
app.include_router(ws.router)
app.include_router(leaderboard.router)
app.include_router(hierarchy.router)
app.include_router(notifications.router)


@app.on_event("startup")
def startup_event():
    """Create tables and ensure default admin exists on first boot."""
    models.Base.metadata.create_all(bind=database.engine)

    db = database.SessionLocal()
    try:
        # Auto-create default admin if none exists
        admin_exists = db.query(models.User).filter(
            models.User.role == models.UserRole.SUPERADMIN
        ).first()

        if not admin_exists:
            from routers.auth import hash_password
            default_admin = models.User(
                username="admin",
                email="admin@gradeup.com",
                hashed_password=hash_password("123"),
                role=models.UserRole.SUPERADMIN,
                stars=0,
                bio="Default SuperAdministrator"
            )
            db.add(default_admin)
            db.commit()
            logger.info("✅ Default superadmin created: username=admin, password=123")
        else:
            logger.info("Admin account already exists — skipping auto-creation.")
        mod_exists = db.query(models.User).filter(
            models.User.role == models.UserRole.MODERATOR
        ).first()

        if not mod_exists:
            from routers.auth import hash_password
            default_mod = models.User(
                username="moderator",
                email="moderator@gradeup.com",
                hashed_password=hash_password("123"),
                role=models.UserRole.MODERATOR,
                stars=0,
                bio="Default Moderator Account"
            )
            db.add(default_mod)
            db.commit()
            logger.info("✅ Default moderator created: username=moderator, password=123")

        # Auto-create default teacher
        teacher_exists = db.query(models.User).filter(
            models.User.role == models.UserRole.TEACHER
        ).first()

        if not teacher_exists:
            from routers.auth import hash_password
            default_teacher = models.User(
                username="teacher",
                email="teacher@gradeup.com",
                hashed_password=hash_password("123"),
                role=models.UserRole.TEACHER,
                stars=0,
                bio="Default Teacher Account"
            )
            db.add(default_teacher)
            db.commit()
            logger.info("✅ Default teacher created: username=teacher, password=123")

        # Auto-create default student
        student_exists = db.query(models.User).filter(
            models.User.role == models.UserRole.STUDENT
        ).first()

        if not student_exists:
            from routers.auth import hash_password
            default_student = models.User(
                username="student",
                email="student@gradeup.com",
                hashed_password=hash_password("123"),
                role=models.UserRole.STUDENT,
                stars=50,
                bio="Default Student Account"
            )
            db.add(default_student)
            db.commit()
            logger.info("✅ Default student created: username=student, password=123")

        # Auto-create HSC Curriculum if missing
        group_exists = db.query(models.Group).first()
        if not group_exists:
            from seed import hsc_curriculum, create_hierarchy
            logger.info("⏳ Seeding HSC Curriculum data...")
            for group_name, subjects in hsc_curriculum.items():
                create_hierarchy(db, group_name, subjects)
            logger.info("✅ HSC Curriculum successfully seeded into the database!")

    except Exception as e:
        logger.error(f"Startup initialization failed: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


@app.get("/", tags=["health"])
def read_root():
    return {"status": "ok", "message": "GradeUp API is running", "docs": "/api/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
