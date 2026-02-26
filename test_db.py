import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from backend.database import engine, SessionLocal
from backend import models, schemas
import traceback

db = SessionLocal()
print("Checking QuestionSets...")
try:
    sets = db.query(models.QuestionSet).all()
    print(f"Total Sets: {len(sets)}")
    for s in sets:
        print(f"Set: {s.id} {s.title} subject={s.subject_id} status={s.status}")
        try:
            # We must use from_attributes starting in Pydantic v2 which this project likely uses (or from_orm in v1)
            # Try both or just construct it:
            if hasattr(schemas.QuestionSetResponse, 'model_validate'):
                schemas.QuestionSetResponse.model_validate(s)
            else:
                schemas.QuestionSetResponse.from_orm(s)
        except Exception as e:
            print(f"  -> Validation error: {e}")
except Exception as e:
    print(e)
    
print("Checking Exams...")
try:
    exams = db.query(models.Exam).all()
    print(f"Total Exams: {len(exams)}")
    for e in exams:
        print(f"Exam: {e.id} set={e.set_id} status={e.status}")
        try:
            if hasattr(schemas.ExamResponse, 'model_validate'):
                schemas.ExamResponse.model_validate(e)
            else:
                schemas.ExamResponse.from_orm(e)
        except Exception as e:
            print(f"  -> Validation error: {e}")
except Exception as e:
    print(e)

print("Checking Questions...")
try:
    questions = db.query(models.Question).all()
    print(f"Total Questions: {len(questions)}")
    for q in questions:
        try:
            if hasattr(schemas.QuestionResponse, 'model_validate'):
                schemas.QuestionResponse.model_validate(q)
            else:
                schemas.QuestionResponse.from_orm(q)
        except Exception as e:
            print(f"  -> Validation error on Question {q.id}: {e}")
except Exception as e:
    print(e)
