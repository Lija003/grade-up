from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
from datetime import datetime
from models import UserRole, DifficultyLevel, ExamStatus

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.STUDENT

class UserResponse(UserBase):
    id: int
    role: UserRole
    stars: int = 0
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Notifications ---
class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "info"
    is_read: bool = False

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None

class UserUpdateAdmin(UserUpdate):
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    stars: Optional[int] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


# --- Hierarchy ---
class GroupBase(BaseModel):
    name: str

class GroupCreate(GroupBase):
    pass

class GroupResponse(GroupBase):
    id: int

    class Config:
        from_attributes = True

class SubjectBase(BaseModel):
    name: str

class SubjectCreate(SubjectBase):
    group_id: int

class SubjectResponse(SubjectBase):
    id: int
    group_id: int

    class Config:
        from_attributes = True

class PaperBase(BaseModel):
    name: str

class PaperCreate(PaperBase):
    subject_id: int

class PaperResponse(PaperBase):
    id: int
    subject_id: int

    class Config:
        from_attributes = True

class ChapterBase(BaseModel):
    name: str

class ChapterCreate(ChapterBase):
    paper_id: int

class ChapterResponse(ChapterBase):
    id: int
    paper_id: int

    class Config:
        from_attributes = True


# --- Questions ---
class QuestionBase(BaseModel):
    text: str = Field(..., max_length=2000)
    image_url: Optional[str] = Field(None, max_length=1000)
    
    option_a: str = Field(..., max_length=500)
    option_b: str = Field(..., max_length=500)
    option_c: str = Field(..., max_length=500)
    option_d: str = Field(..., max_length=500)
    
    correct_option: str = Field(..., max_length=10) # e.g. "A"
    
    explanation: Optional[str] = Field(None, max_length=1500)
    explanation_image_url: Optional[str] = Field(None, max_length=1000)
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    marks: float = Field(1.0, ge=0)

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    image_url: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: Optional[DifficultyLevel] = None
    marks: Optional[float] = None

class QuestionResponse(QuestionBase):
    id: int
    chapter_id: int
    creator_id: int
    creator: Optional['UserSummary'] = None
    status: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True

class UserSummary(BaseModel):
    username: str
    role: UserRole
    
    class Config:
        from_attributes = True

# --- Exams ---
class ExamBase(BaseModel):
    title: str
    group_id: int
    subject_id: int
    paper_id: int
    chapter_id: int
    start_time: datetime
    end_time: datetime
    duration_minutes: int

class ExamCreate(ExamBase):
    question_ids: List[int]

class ExamResponse(ExamBase):
    id: int
    status: ExamStatus
    teacher_id: int
    teacher: Optional[UserSummary] = None
    
    group: Optional['GroupResponse'] = None
    subject: Optional['SubjectResponse'] = None
    paper: Optional['PaperResponse'] = None
    chapter: Optional['ChapterResponse'] = None
    exam_questions: List['ExamQuestionResponse'] = []
    
    class Config:
        from_attributes = True

class ExamQuestionResponse(BaseModel):
    id: int
    exam_id: int
    question_id: int
    question: Optional['QuestionResponse'] = None
    
    class Config:
        from_attributes = True

class ExamAttemptBase(BaseModel):
    exam_id: int

class ExamAttemptCreate(ExamAttemptBase):
    pass

class StudentResponseCreate(BaseModel):
    question_id: int
    selected_option: str

class ExamAttemptResponse(ExamAttemptBase):
    id: int
    student_id: int
    start_time: datetime
    is_practice: bool = False
    exam_title: Optional[str] = None
    
    class Config:
        from_attributes = True


class QuestionForStudent(BaseModel):
    id: int
    text: str
    image_url: Optional[str]
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    marks: float
    difficulty: DifficultyLevel 

    class Config:
        from_attributes = True

class ExamAttemptFullResponse(ExamAttemptResponse):
    exam_duration_minutes: int = 60
    questions: List[QuestionForStudent] = []

class ExamResultResponse(ExamAttemptResponse):
    score: float
    total_questions: int
    correct_count: int
    incorrect_count: int
    
    class Config:
        from_attributes = True

class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    score: float
    accuracy: float
    time_taken_seconds: int
    
    class Config:
        from_attributes = True

class QuestionAnalysis(BaseModel):
    question_text: str
    selected_option: Optional[str]
    correct_option: str
    explanation: Optional[str]
    is_correct: bool
    marks: float

class ExamResultFullResponse(ExamResultResponse):
    details: List[QuestionAnalysis] = []
