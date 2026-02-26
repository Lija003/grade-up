from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import database, models, schemas
from routers import auth

router = APIRouter(
    prefix="/questions",
    tags=["questions"]
)

from fastapi import UploadFile, File
import shutil
import uuid
import os

@router.post("/upload")
def upload_file(file: UploadFile = File(...)):
    try:
        file_ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        os.makedirs("static/uploads", exist_ok=True)
        file_path = f"static/uploads/{filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"url": f"http://localhost:8000/static/uploads/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/chapters/{chapter_id}/questions", response_model=schemas.QuestionResponse)
def add_question(
    chapter_id: int,
    question: schemas.QuestionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.MODERATOR, models.UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_question = models.Question(
        chapter_id=chapter_id,
        creator_id=current_user.id,
        text=question.text,
        image_url=question.image_url,
        option_a=question.option_a,
        option_b=question.option_b,
        option_c=question.option_c,
        option_d=question.option_d,
        correct_option=question.correct_option,
        explanation=question.explanation,
        difficulty=question.difficulty,
        marks=question.marks,
        status="active"
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    return new_question


@router.put("/{question_id}", response_model=schemas.QuestionResponse)
def update_question(
    question_id: int,
    question_data: schemas.QuestionUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.SUPERADMIN] and question.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this question")
        
    if question_data.text is not None:
        question.text = question_data.text
    if question_data.image_url is not None:
        question.image_url = question_data.image_url
    if question_data.option_a is not None:
        question.option_a = question_data.option_a
    if question_data.option_b is not None:
        question.option_b = question_data.option_b
    if question_data.option_c is not None:
        question.option_c = question_data.option_c
    if question_data.option_d is not None:
        question.option_d = question_data.option_d
    if question_data.correct_option is not None:
        question.correct_option = question_data.correct_option
    if question_data.explanation is not None:
        question.explanation = question_data.explanation
    if question_data.difficulty is not None:
        question.difficulty = question_data.difficulty
    if question_data.marks is not None:
        question.marks = question_data.marks
        
    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.SUPERADMIN] and question.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this question")
        
    db.delete(question)
    db.commit()
    return {"message": "Question deleted successfully"}
