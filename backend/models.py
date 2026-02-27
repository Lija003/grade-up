from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    MODERATOR = "moderator"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"

class DifficultyLevel(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    PRO = "pro"

class ExamStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ACTIVE = "active"
    COMPLETED = "completed"
    SCHEDULED = "scheduled"

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    
    subjects = relationship("Subject", back_populates="group", cascade="all, delete-orphan")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    
    group = relationship("Group", back_populates="subjects")
    papers = relationship("Paper", back_populates="subject", cascade="all, delete-orphan")

class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) # e.g., First Paper / Second Paper
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    
    subject = relationship("Subject", back_populates="papers")
    chapters = relationship("Chapter", back_populates="paper", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    
    paper = relationship("Paper", back_populates="chapters")
    questions = relationship("Question", back_populates="chapter", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT)
    
    # Gamification & Profile
    stars = Column(Integer, default=0) # For Students
    avatar_url = Column(String(255), nullable=True)
    bio = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("Question", back_populates="creator", cascade="all, delete-orphan")
    exam_attempts = relationship("ExamAttempt", back_populates="student", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan", order_by="desc(Notification.created_at)")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(20), default="info") # info, success, warning, error
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    image_url = Column(String(255), nullable=True)
    
    option_a = Column(String(500), nullable=False)
    option_b = Column(String(500), nullable=False)
    option_c = Column(String(500), nullable=False)
    option_d = Column(String(500), nullable=False)
    
    correct_option = Column(String(10), nullable=False) # e.g., "A", "B", "C", "D"
    
    explanation = Column(Text, nullable=True)
    explanation_image_url = Column(String(255), nullable=True)
    
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.MEDIUM)
    marks = Column(Float, default=1.0)
    
    chapter = relationship("Chapter", back_populates="questions")
    creator = relationship("User", back_populates="questions")

    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False) # When the exam window closes
    duration_minutes = Column(Integer, nullable=False)
    status = Column(String(20), default="scheduled")
    
    teacher = relationship("User")
    group = relationship("Group")
    subject = relationship("Subject")
    paper = relationship("Paper")
    chapter = relationship("Chapter")
    
    exam_questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan")
    attempts = relationship("ExamAttempt", back_populates="exam", cascade="all, delete-orphan")

class ExamQuestion(Base):
    __tablename__ = "exam_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    
    exam = relationship("Exam", back_populates="exam_questions")
    question = relationship("Question")

class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(DateTime, default=datetime.utcnow)
    submit_time = Column(DateTime, nullable=True)
    
    score = Column(Float, default=0.0)
    total_questions = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    is_practice = Column(Boolean, default=False)
    
    exam = relationship("Exam", back_populates="attempts")
    student = relationship("User", back_populates="exam_attempts")
    responses = relationship("StudentResponse", back_populates="attempt", cascade="all, delete-orphan")

class StudentResponse(Base):
    __tablename__ = "student_responses"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("exam_attempts.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    selected_option = Column(String(10), nullable=True) # "A", "B", etc.
    
    attempt = relationship("ExamAttempt", back_populates="responses")
