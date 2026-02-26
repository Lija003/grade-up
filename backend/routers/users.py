from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
import uuid
import database, models, schemas
from routers import auth
from models import UserRole

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

# Helper to check if current user is admin
def check_admin(user: models.User = Depends(auth.get_current_user)):
    if user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized"
        )
    return user

# Helper to check if current user is admin or moderator
def check_moderator_or_admin(user: models.User = Depends(auth.get_current_user)):
    if user.role not in [UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized. Requires Moderator or Admin role."
        )
    return user

@router.get("/", response_model=List[schemas.UserResponse])
def get_all_users(
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    return db.query(models.User).all()

@router.post("/", response_model=schemas.UserResponse)
def create_user_by_admin(
    user: schemas.UserCreate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    # Check if email exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Enforce SUPERADMIN rules for creation
    if user.role in [UserRole.ADMIN, UserRole.SUPERADMIN] and admin.role != UserRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Only SuperAdmin can create Admin or SuperAdmin accounts.")
    
    hashed_password = auth.hash_password(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
         
    # Prevent deleting oneself
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    # Prevent deleting SuperAdmin
    if user.role == UserRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="SuperAdmin accounts cannot be deleted.")

    # Prevent regular Admin from deleting other Admins
    if user.role == UserRole.ADMIN and admin.role != UserRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Only SuperAdmin can delete Admin accounts")
    
    # Check for related data
    if user.role == UserRole.TEACHER:
        question_set_count = db.query(models.QuestionSet).filter(models.QuestionSet.creator_id == user_id).count()
        if question_set_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete this teacher. They have created {question_set_count} question set(s). Please reassign or delete those first."
            )
    

    try:
        db.delete(user)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_profile(
    current_user: models.User = Depends(auth.get_current_user)
):
    return current_user

@router.post("/me/avatar", response_model=schemas.UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Create upload directory if it doesn't exist (safety check)
    upload_dir = "backend/static/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not save file")
        
    # Update user profile
    # URL will be /static/uploads/filename
    avatar_url = f"http://localhost:8000/static/uploads/{unique_filename}"
    current_user.avatar_url = avatar_url
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_own_profile(
    user_update: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if user_update.username is not None and user_update.username != current_user.username:
        existing = db.query(models.User).filter(models.User.username == user_update.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")
        current_user.username = user_update.username

    if user_update.bio is not None:
        current_user.bio = user_update.bio
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/leaderboard/teachers", response_model=List[schemas.UserResponse])
def get_teacher_leaderboard(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Return top 50 teachers sorted by reputation
    return db.query(models.User).filter(models.User.role == models.UserRole.TEACHER).order_by(models.User.reputation.desc()).limit(50).all()

@router.get("/leaderboard/students", response_model=List[schemas.UserResponse])
def get_student_leaderboard(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Return top 50 students sorted by stars
    return db.query(models.User).filter(models.User.role == models.UserRole.STUDENT).order_by(models.User.stars.desc()).limit(50).all()

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user_by_admin(
    user_id: int,
    user_update: schemas.UserUpdateAdmin,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_update.email is not None:
        # Check uniqueness if email is changing
        if user_update.email != user.email:
             existing = db.query(models.User).filter(models.User.email == user_update.email).first()
             if existing:
                 raise HTTPException(status_code=400, detail="Email already in use")
        user.email = user_update.email
        
    if user_update.role is not None:
        user.role = user_update.role
    if user_update.stars is not None:
        user.stars = user_update.stars
    if user_update.reputation is not None:
        user.reputation = user_update.reputation
    if user_update.bio is not None:
        user.bio = user_update.bio
        
    db.commit()
    db.refresh(user)
    return user

@router.get("/admin/stats", tags=["stats"])
def get_admin_stats(
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    users = db.query(models.User).all()
    teachers = sum(1 for u in users if u.role == models.UserRole.TEACHER)
    admins = sum(1 for u in users if u.role == models.UserRole.ADMIN)
    students = len(users) - teachers - admins
    
    import datetime
    today = datetime.datetime.utcnow()
    # Assume created_at exists; fallback to today if missing (old data)
    new_users_today = sum(1 for u in users if getattr(u, 'created_at', today).date() == today.date())
    
    growth_data = []
    for i in range(6, -1, -1):
        d = today.date() - datetime.timedelta(days=i)
        day_count = sum(1 for u in users if getattr(u, 'created_at', today).date() <= d)
        growth_data.append({
            "date": d.strftime("%a"),
            "users": day_count
        })
        
    role_data = [
        {"name": "Students", "value": students, "color": "#3b82f6"},
        {"name": "Teachers", "value": teachers, "color": "#10b981"},
        {"name": "Admins", "value": admins, "color": "#8b5cf6"}
    ]
    
    return {
        "totalUsers": len(users),
        "totalTeachers": teachers,
        "totalStudents": students,
        "activeSessions": max(1, int(len(users) * 0.1)), # Faked dynamic
        "newUsersToday": new_users_today,
        "growthData": growth_data,
        "roleData": role_data
    }
