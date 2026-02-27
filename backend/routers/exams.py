from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
import database, models, schemas
from routers import auth

router = APIRouter(
    prefix="/exams",
    tags=["exams"]
)

@router.get("/chapter-questions/{chapter_id}", response_model=List[schemas.QuestionResponse])
def get_chapter_questions(
    chapter_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in [models.UserRole.TEACHER, models.UserRole.ADMIN, models.UserRole.MODERATOR, models.UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Get all active questions in this chapter
    questions = db.query(models.Question).options(joinedload(models.Question.creator)).filter(
        models.Question.chapter_id == chapter_id,
        models.Question.status == "active"
    ).all()
    
    return questions

@router.post("/", response_model=schemas.ExamResponse)
def schedule_exam(
    exam_data: schemas.ExamCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not exam_data.question_ids:
        raise HTTPException(status_code=400, detail="An exam must contain at least one question")

    # DB expects naive datetime usually
    import datetime as dt
    start_time_naive = exam_data.start_time
    if start_time_naive.tzinfo:
        start_time_naive = start_time_naive.astimezone(dt.timezone.utc).replace(tzinfo=None)
        
    end_time_naive = exam_data.end_time
    if end_time_naive.tzinfo:
        end_time_naive = end_time_naive.astimezone(dt.timezone.utc).replace(tzinfo=None)

    # Determine status based on time
    exam_status = models.ExamStatus.PENDING
    now = datetime.utcnow()
    if start_time_naive <= now:
        exam_status = models.ExamStatus.ACTIVE
    else:
        exam_status = models.ExamStatus.SCHEDULED
            
    try:
        new_exam = models.Exam(
            title=exam_data.title,
            teacher_id=current_user.id,
            group_id=exam_data.group_id,
            subject_id=exam_data.subject_id,
            paper_id=exam_data.paper_id,
            chapter_id=exam_data.chapter_id,
            start_time=start_time_naive,
            end_time=end_time_naive,
            duration_minutes=exam_data.duration_minutes,
            status=exam_status
        )
        db.add(new_exam)
        db.commit()
        db.refresh(new_exam)
        
        # Link questions
        exam_questions = []
        for q_id in exam_data.question_ids:
            exam_questions.append(models.ExamQuestion(exam_id=new_exam.id, question_id=q_id))
        
        if exam_questions:
            db.bulk_save_objects(exam_questions)
            db.commit()
            
        return new_exam
    except Exception as e:
        import traceback
        with open("backend_error.log", "w") as f:
            f.write(traceback.format_exc())
            f.write(f"\nError: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[schemas.ExamResponse])
def list_exams(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Exam).options(
        joinedload(models.Exam.exam_questions).joinedload(models.ExamQuestion.question),
        joinedload(models.Exam.teacher)
    )
    
    if current_user.role == models.UserRole.STUDENT:
        query = query.filter(models.Exam.status.in_([
            models.ExamStatus.ACTIVE,
            models.ExamStatus.SCHEDULED
        ]))
    elif current_user.role == models.UserRole.TEACHER:
        query = query.filter(models.Exam.teacher_id == current_user.id)
        
    exams = query.all()
    
    # Auto-expire exams that have passed their end time
    now = datetime.utcnow()
    updated = False
    for exam in exams:
        if exam.status == models.ExamStatus.ACTIVE and exam.end_time and exam.end_time <= now:
            exam.status = models.ExamStatus.COMPLETED
            updated = True
            
    if updated:
        db.commit()
    
    # Clean up the output list for students if we just expired some
    if current_user.role == models.UserRole.STUDENT:
        exams = [e for e in exams if e.status in [models.ExamStatus.ACTIVE, models.ExamStatus.SCHEDULED]]
        
    return exams

from datetime import timedelta

@router.put("/{exam_id}/activate", response_model=schemas.ExamResponse)
def activate_exam(
    exam_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")

    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if exam.teacher_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to manage this exam")

    now = datetime.utcnow()
    exam.start_time = now
    exam.end_time = now + timedelta(minutes=exam.duration_minutes)
    exam.status = models.ExamStatus.ACTIVE
    
    db.commit()
    db.refresh(exam)
    return exam

@router.put("/{exam_id}/end", response_model=schemas.ExamResponse)
def end_exam(
    exam_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")

    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if exam.teacher_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to manage this exam")

    exam.status = models.ExamStatus.COMPLETED
    exam.end_time = datetime.utcnow()
    db.commit()
    db.refresh(exam)
    return exam

@router.get("/live/participants")
def get_live_participants(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")

    active_exams = db.query(models.Exam).filter(
        models.Exam.teacher_id == current_user.id,
        models.Exam.status == models.ExamStatus.ACTIVE
    ).all()
    exam_ids = [e.id for e in active_exams]
    
    if not exam_ids:
        return {"count": 0, "details": []}
        
    attempts = db.query(models.ExamAttempt)\
        .filter(models.ExamAttempt.exam_id.in_(exam_ids))\
        .filter(models.ExamAttempt.submit_time == None)\
        .count()
        
    return {"count": attempts}

@router.get("/teacher/stats", tags=["stats"])
def get_teacher_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    teacher_exams = db.query(models.Exam).filter(models.Exam.teacher_id == current_user.id).all()
    exam_ids = [e.id for e in teacher_exams]
    
    if not exam_ids:
        return {
            "totalStudents": 0,
            "avgAccuracy": 0,
            "performanceData": [],
            "accuracyData": []
        }
    
    attempts = db.query(models.ExamAttempt).filter(
        models.ExamAttempt.exam_id.in_(exam_ids), 
        models.ExamAttempt.submit_time != None,
        models.ExamAttempt.is_practice == False
    ).all()
    
    unique_students = len(set(a.student_id for a in attempts))
    total_qs = sum(a.total_questions for a in attempts)
    total_correct = sum(a.correct_count for a in attempts)
    avg_accuracy = round((total_correct / total_qs * 100) if total_qs > 0 else 0, 1)
    
    import datetime
    today = datetime.datetime.utcnow().date()
    perf_data = []
    
    for i in range(6, -1, -1):
        d = today - datetime.timedelta(days=i)
        day_attempts = [a for a in attempts if a.submit_time.date() == d]
        qs = sum(a.total_questions for a in day_attempts)
        correct = sum(a.correct_count for a in day_attempts)
        acc = int((correct / qs * 100)) if qs > 0 else 0
        perf_data.append({
            "name": d.strftime("%A")[:3],
            "attempts": len(day_attempts),
            "avgScore": acc
        })
        
    from collections import defaultdict
    subject_stats = defaultdict(lambda: {"total": 0, "correct": 0})
    
    for attempt in attempts:
        exam = next((e for e in teacher_exams if e.id == attempt.exam_id), None)
        if exam and exam.subject:
            sub_name = exam.subject.name
            subject_stats[sub_name]["total"] += attempt.total_questions
            subject_stats[sub_name]["correct"] += attempt.correct_count
            
    acc_data = []
    for sub, stats in subject_stats.items():
        if stats["total"] > 0:
            acc_data.append({
                "subject": sub,
                "accuracy": int(stats["correct"] / stats["total"] * 100)
            })
            
    if not acc_data:
        acc_data = [{"subject": "No Data", "accuracy": 0}]

    return {
        "totalStudents": unique_students,
        "avgAccuracy": avg_accuracy,
        "performanceData": perf_data,
        "accuracyData": acc_data
    }

@router.get("/teacher/stats", tags=["stats"])
def get_teacher_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    teacher_exams = db.query(models.Exam).filter(models.Exam.teacher_id == current_user.id).all()
    exam_ids = [e.id for e in teacher_exams]
    
    if not exam_ids:
        return {
            "totalStudents": 0,
            "avgAccuracy": 0,
            "performanceData": [],
            "accuracyData": []
        }
    
    attempts = db.query(models.ExamAttempt).filter(
        models.ExamAttempt.exam_id.in_(exam_ids), 
        models.ExamAttempt.submit_time != None,
        models.ExamAttempt.is_practice == False
    ).all()
    
    unique_students = len(set(a.student_id for a in attempts))
    total_qs = sum(a.total_questions for a in attempts)
    total_correct = sum(a.correct_count for a in attempts)
    avg_accuracy = round((total_correct / total_qs * 100) if total_qs > 0 else 0, 1)
    
    import datetime
    today = datetime.datetime.utcnow().date()
    perf_data = []
    
    for i in range(6, -1, -1):
        d = today - datetime.timedelta(days=i)
        day_attempts = [a for a in attempts if a.submit_time.date() == d]
        qs = sum(a.total_questions for a in day_attempts)
        correct = sum(a.correct_count for a in day_attempts)
        acc = int((correct / qs * 100)) if qs > 0 else 0
        perf_data.append({
            "name": d.strftime("%A")[:3],
            "attempts": len(day_attempts),
            "avgScore": acc
        })
        
    from collections import defaultdict
    subject_stats = defaultdict(lambda: {"total": 0, "correct": 0})
    
    for attempt in attempts:
        exam = next((e for e in teacher_exams if e.id == attempt.exam_id), None)
        if exam and exam.subject:
            sub_name = exam.subject.name
            subject_stats[sub_name]["total"] += attempt.total_questions
            subject_stats[sub_name]["correct"] += attempt.correct_count
            
    acc_data = []
    for sub, stats in subject_stats.items():
        if stats["total"] > 0:
            acc_data.append({
                "subject": sub,
                "accuracy": int(stats["correct"] / stats["total"] * 100)
            })
            
    if not acc_data:
        acc_data = [{"subject": "No Data", "accuracy": 0}]

    return {
        "totalStudents": unique_students,
        "avgAccuracy": avg_accuracy,
        "performanceData": perf_data,
        "accuracyData": acc_data
    }

@router.get("/{exam_id}", response_model=schemas.ExamResponse)
def get_exam(
    exam_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    exam = db.query(models.Exam).options(
        joinedload(models.Exam.exam_questions).joinedload(models.ExamQuestion.question),
        joinedload(models.Exam.teacher)
    ).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.get("/{exam_id}/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_exam_leaderboard(
    exam_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    attempts = db.query(models.ExamAttempt).options(joinedload(models.ExamAttempt.student)).filter(
        models.ExamAttempt.exam_id == exam_id,
        models.ExamAttempt.submit_time != None,
        models.ExamAttempt.is_practice == False
    ).all()
    
    leaderboard_data = []
    for attempt in attempts:
        user = attempt.student
        duration = (attempt.submit_time - attempt.start_time).total_seconds()
        accuracy = (attempt.correct_count / attempt.total_questions * 100) if attempt.total_questions > 0 else 0
        
        leaderboard_data.append({
            "username": user.username,
            "score": attempt.score,
            "accuracy": accuracy,
            "time_taken_seconds": int(duration),
            "raw_obj": attempt
        })
        
    leaderboard_data.sort(key=lambda x: (-x['score'], x['time_taken_seconds']))
    
    result = []
    for i, entry in enumerate(leaderboard_data):
        result.append(schemas.LeaderboardEntry(
            score=entry['score'],
            accuracy=entry['accuracy'],
            time_taken_seconds=entry['time_taken_seconds']
        ))
        
    return result

@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in [models.UserRole.TEACHER, models.UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if exam.teacher_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this exam")

    db.delete(exam)
    db.commit()
    return {"ok": True}
