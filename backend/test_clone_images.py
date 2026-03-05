import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
import models
from datetime import datetime, timedelta

def main():
    db = SessionLocal()
    try:
        # Get demo student and teacher
        teacher = db.query(models.User).filter(models.User.username == "teacher_demo").first()
        student = db.query(models.User).filter(models.User.username == "student_demo").first()
        group = db.query(models.Group).first()
        subj = db.query(models.Subject).first()
        paper = db.query(models.Paper).first()
        chapter = db.query(models.Chapter).first()
        
        if not (teacher and student and group and subj and paper and chapter):
            print("Missing DB seed data.")
            return

        print("Data loaded.")
        
        # 1. Create Question Set and Question with Image
        q_set = models.QuestionSet(
            title="Image Test Set",
            chapter_id=chapter.id,
            creator_id=teacher.id,
            status="active"
        )
        db.add(q_set)
        db.commit()
        db.refresh(q_set)

        question = models.Question(
            set_id=q_set.id,
            text="What is this image?",
            image_url="http://localhost:8000/static/uploads/test_image.png",
            option_a="A", option_b="B", option_c="C", option_d="D",
            correct_option="A",
            status="active"
        )
        db.add(question)
        db.commit()
        db.refresh(question)
        
        now = datetime.utcnow()

        # 2. Schedule Original Exam
        exam1 = models.Exam(
            title="Original Exam",
            teacher_id=teacher.id, group_id=group.id, subject_id=subj.id, paper_id=paper.id, chapter_id=chapter.id,
            start_time=now - timedelta(minutes=10),
            end_time=now + timedelta(hours=1),
            duration_minutes=30, status=models.ExamStatus.ACTIVE
        )
        db.add(exam1)
        db.commit()
        db.refresh(exam1)
        
        db.add(models.ExamQuestion(exam_id=exam1.id, question_id=question.id))
        db.commit()

        # 3. Schedule Cloned Exam (simulating what routers/exams.py does)
        exam2 = models.Exam(
            title="Cloned Exam",
            teacher_id=teacher.id, group_id=group.id, subject_id=subj.id, paper_id=paper.id, chapter_id=chapter.id,
            start_time=now - timedelta(minutes=5),
            end_time=now + timedelta(hours=1),
            duration_minutes=30, status=models.ExamStatus.ACTIVE
        )
        db.add(exam2)
        db.commit()
        db.refresh(exam2)
        
        db.add(models.ExamQuestion(exam_id=exam2.id, question_id=question.id))
        db.commit()

        # 4. Student Starts Attempts
        attempt1 = models.ExamAttempt(exam_id=exam1.id, student_id=student.id, is_practice=False)
        db.add(attempt1)
        attempt2 = models.ExamAttempt(exam_id=exam2.id, student_id=student.id, is_practice=False)
        db.add(attempt2)
        db.commit()
        
        # 5. Simulate fetching /attempt/{id}/details for Cloned Exam
        print("\n--- FETCHING CLONED EXAM QUESTIONS (routers/exams_student.py logic) ---")
        exam_qs = db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam2.id).all()
        q_ids = [eq.question_id for eq in exam_qs]
        questions = db.query(models.Question).filter(models.Question.id.in_(q_ids)).all()
        
        for q in questions:
            print(f"ID: {q.id}, Text: '{q.text}', Image URL: '{q.image_url}'")

    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == '__main__':
    main()
