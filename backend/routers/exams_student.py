from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta
import database, models, schemas
from routers import auth

router = APIRouter(
    prefix="/exams/student",
    tags=["exams-student"]
)

@router.get("/available", response_model=List[schemas.ExamResponse])
def get_available_exams(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    now = datetime.utcnow()
    
    # Fetch all valid exams so students see upcoming, active, AND completed exams
    exams = db.query(models.Exam).options(
        joinedload(models.Exam.subject),
        joinedload(models.Exam.group),
        joinedload(models.Exam.paper),
        joinedload(models.Exam.chapter)
    ).all()
    
    status_changed = False
    
    for exam in exams:
        # Dynamically compute strict state
        computed_status = exam.status
        if now < exam.start_time:
            computed_status = models.ExamStatus.SCHEDULED
        elif exam.start_time <= now <= exam.end_time:
            computed_status = models.ExamStatus.ACTIVE
        else:
            computed_status = models.ExamStatus.COMPLETED
            
        if exam.status != computed_status:
            exam.status = computed_status
            status_changed = True
            
    if status_changed:
        db.commit()
    
    return exams

@router.get("/recent", response_model=List[schemas.ExamResponse])
def get_recent_exams(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    now = datetime.utcnow()
    # Concluded exams: end_time <= now
    exams = db.query(models.Exam).filter(
        models.Exam.end_time <= now
    ).order_by(models.Exam.end_time.desc()).limit(20).all()
    
    return exams

@router.get("/history", response_model=List[schemas.ExamResultResponse])
def get_student_exam_history(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    attempts = db.query(models.ExamAttempt).filter(
        models.ExamAttempt.student_id == current_user.id,
        models.ExamAttempt.submit_time != None
    ).order_by(models.ExamAttempt.submit_time.desc()).all()
    
    return attempts

@router.get("/live", response_model=List[schemas.ExamResponse])
def get_live_exams(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    now = datetime.utcnow()
    exams = db.query(models.Exam).filter(
        models.Exam.status == models.ExamStatus.ACTIVE,
        models.Exam.end_time >= now
    ).all()
    return exams

@router.post("/attempt", response_model=schemas.ExamAttemptFullResponse)
def start_exam_attempt(
    attempt_data: schemas.ExamAttemptCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    exam = db.query(models.Exam).filter(models.Exam.id == attempt_data.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    now = datetime.utcnow()
    if now < exam.start_time:
        raise HTTPException(status_code=403, detail="Exam has not started yet.")
        
    is_practice = False
    if now > exam.end_time:
        is_practice = True
        
    existing = db.query(models.ExamAttempt).filter(
        models.ExamAttempt.exam_id == attempt_data.exam_id, 
        models.ExamAttempt.student_id == current_user.id
    ).order_by(models.ExamAttempt.id.desc()).first()
    
    if existing and not existing.submit_time:
        # Resume logic
        exam_qs = db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam.id).all()
        q_ids = [eq.question_id for eq in exam_qs]
        questions = db.query(models.Question).filter(models.Question.id.in_(q_ids)).all()
        if not questions:
            raise HTTPException(status_code=400, detail="This exam has no questions.")
        existing.questions = questions 
        existing.exam_duration_minutes = exam.duration_minutes
        existing.exam_title = exam.title or f"Exam #{exam.id}"
        return existing
    elif existing and existing.submit_time and not is_practice:
        raise HTTPException(status_code=400, detail="You have already completed this official exam. Wait for it to conclude to practice.")

    new_attempt = models.ExamAttempt(
        exam_id=attempt_data.exam_id,
        student_id=current_user.id,
        start_time=datetime.utcnow(),
        is_practice=is_practice
    )
    db.add(new_attempt)
    db.commit()
    db.refresh(new_attempt)
    
    exam_qs = db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam.id).all()
    q_ids = [eq.question_id for eq in exam_qs]
    questions = db.query(models.Question).filter(models.Question.id.in_(q_ids)).all()
    
    if not questions:
        db.delete(new_attempt)
        db.commit()
        raise HTTPException(status_code=400, detail="This exam does not have any questions and cannot be started.")
        
    new_attempt.questions = questions
    new_attempt.exam_duration_minutes = exam.duration_minutes
    new_attempt.exam_title = exam.title or f"Exam #{exam.id}"
    
    return new_attempt



@router.get("/attempt/{attempt_id}/details", response_model=schemas.ExamAttemptFullResponse)
def get_attempt_details(
    attempt_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    attempt = db.query(models.ExamAttempt).options(
        joinedload(models.ExamAttempt.exam)
    ).filter(models.ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    if attempt.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    exam = attempt.exam
    exam_qs = db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam.id).all()
    q_ids = [eq.question_id for eq in exam_qs]
    questions = db.query(models.Question).filter(models.Question.id.in_(q_ids)).all()
    
    attempt.questions = questions
    attempt.exam_duration_minutes = exam.duration_minutes
    attempt.exam_title = exam.title or f"Exam #{exam.id}"
    
    return attempt

@router.post("/attempt/{attempt_id}/answer")
def submit_answer(
    attempt_id: int,
    response_data: schemas.StudentResponseCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    attempt = db.query(models.ExamAttempt).filter(models.ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    if attempt.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if attempt.submit_time:
        raise HTTPException(status_code=400, detail="Exam already submitted")

    # Verify the question belongs to this exam
    exam_q = db.query(models.ExamQuestion).filter(
        models.ExamQuestion.exam_id == attempt.exam_id,
        models.ExamQuestion.question_id == response_data.question_id
    ).first()
    
    if not exam_q:
        raise HTTPException(status_code=400, detail="Invalid question for this exam")

    existing_response = db.query(models.StudentResponse).filter(
        models.StudentResponse.attempt_id == attempt_id,
        models.StudentResponse.question_id == response_data.question_id
    ).first()

    if existing_response:
        existing_response.selected_option = response_data.selected_option
    else:
        new_response = models.StudentResponse(
            attempt_id=attempt_id,
            question_id=response_data.question_id,
            selected_option=response_data.selected_option
        )
        db.add(new_response)
    
    db.commit()
    return {"status": "saved"}

@router.post("/attempt/{attempt_id}/finish")
def finish_exam(
    attempt_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    attempt = db.query(models.ExamAttempt).filter(models.ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    if attempt.student_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized")

    if attempt.submit_time:
        raise HTTPException(status_code=400, detail="Exam already submitted")

    now = datetime.utcnow()
    attempt.submit_time = now
    
    score = 0
    correct = 0
    incorrect = 0
    total = 0
    
    exam = attempt.exam
    exam_qs = db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam.id).all()
    q_ids = [eq.question_id for eq in exam_qs]
    questions = db.query(models.Question).filter(models.Question.id.in_(q_ids)).all()
    
    question_map = {q.id: q for q in questions}
    total = len(questions)
    
    responses = db.query(models.StudentResponse).filter(models.StudentResponse.attempt_id == attempt_id).all()
    
    for resp in responses:
        q = question_map.get(resp.question_id)
        if q and q.correct_option == resp.selected_option:
            score += q.marks
            correct += 1
        elif q:
            incorrect += 1
            
    attempt.score = score
    attempt.correct_count = correct
    attempt.incorrect_count = incorrect
    attempt.total_questions = total
    
    if not attempt.is_practice:
        stars_earned = int(score) 
        current_user.stars += stars_earned
    
    db.commit()
    
    return {"status": "submitted", "score": score, "attempt_id": attempt_id}

@router.get("/attempt/{attempt_id}/result", response_model=schemas.ExamResultFullResponse)
def get_exam_result(
    attempt_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    attempt = db.query(models.ExamAttempt).filter(models.ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    if attempt.student_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    if not attempt.submit_time:
        raise HTTPException(status_code=400, detail="Exam not yet submitted")
    
    details = []
    exam_qs = db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == attempt.exam_id).all()
    q_ids = [eq.question_id for eq in exam_qs]
    questions = db.query(models.Question).filter(models.Question.id.in_(q_ids)).all()
    
    responses = db.query(models.StudentResponse).filter(models.StudentResponse.attempt_id == attempt_id).all()
    response_map = {r.question_id: r.selected_option for r in responses}
    
    for q in questions:
        selected = response_map.get(q.id)
        is_correct = (selected == q.correct_option)
        details.append({
            "question_text": q.text,
            "selected_option": selected,
            "correct_option": q.correct_option,
            "explanation": q.explanation,
            "is_correct": is_correct,
            "marks": q.marks
        })
        
    attempt.details = details
    attempt.exam_title = attempt.exam.title if attempt.exam else f"Exam #{attempt.exam_id}"
    return attempt

@router.get("/stats", tags=["stats"])
def get_student_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    attempts = db.query(models.ExamAttempt).filter(
        models.ExamAttempt.student_id == current_user.id,
        models.ExamAttempt.submit_time != None,
        models.ExamAttempt.is_practice == False
    ).all()

    total_exams = len(attempts)
    
    import datetime
    from collections import defaultdict
    
    sorted_attempts = sorted(attempts, key=lambda a: a.submit_time)
    last_10 = sorted_attempts[-10:] if len(sorted_attempts) > 10 else sorted_attempts
    
    perf_data = []
    for i, a in enumerate(last_10):
        acc = int((a.correct_count / a.total_questions * 100)) if a.total_questions > 0 else 0
        perf_data.append({
            "name": f"T{i+1}",
            "score": acc,
            "accuracy": acc
        })
        
    subject_stats = defaultdict(lambda: {"total": 0, "correct": 0})
    for a in attempts:
        exam = a.exam
        sub_name = "General"
        if exam and exam.subject:
            sub_name = exam.subject.name
            
        subject_stats[sub_name]["total"] += a.total_questions
        subject_stats[sub_name]["correct"] += a.correct_count
        
    sub_data = []
    for sub, stats in subject_stats.items():
        if stats["total"] > 0:
            sub_data.append({
                "subject": sub,
                "proficiency": int(stats["correct"] / stats["total"] * 100)
            })
            
    recent_results = sorted_attempts[-3:]
    recent_dicts = []
    for r in reversed(recent_results):
        recent_dicts.append({
            "exam_id": r.exam_id,
            "title": r.exam.title if r.exam else f"Exam #{r.exam_id}",
            "score": int((r.correct_count / r.total_questions * 100)) if r.total_questions > 0 else 0,
            "submitted_at": r.submit_time.isoformat(),
            "start_time": r.start_time.isoformat()
        })
        
    total_qs = sum(a.total_questions for a in attempts)
    total_correct = sum(a.correct_count for a in attempts)
    avg_accuracy = int((total_correct / total_qs * 100)) if total_qs > 0 else 0
    high_score = max([int((a.correct_count / a.total_questions * 100) if a.total_questions > 0 else 0) for a in attempts], default=0)

    rank = db.query(models.User).filter(
        models.User.role == models.UserRole.STUDENT, 
        models.User.stars > current_user.stars
    ).count() + 1

    return {
        "totalExams": total_exams,
        "avgAccuracy": avg_accuracy,
        "highScore": high_score,
        "rank": rank,
        "stars": current_user.stars,
        "performanceData": perf_data if len(perf_data) > 0 else [{"name": "No Data", "score": 0, "accuracy": 0}],
        "subjectData": sub_data if len(sub_data) > 0 else [{"subject": "No Data", "proficiency": 0}],
        "recentResults": recent_dicts
    }
