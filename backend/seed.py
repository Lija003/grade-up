# ============================================================
# GradeUp HSC Curriculum Database Seed Script
# Run once to populate predefined NCTB HSC Curriculum.
# ============================================================

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
import models
from routers.auth import hash_password
from datetime import datetime
from sqlalchemy import text

# ---- Curriculum Definition ----
hsc_curriculum = {
    "SCIENCE": {
        "Physics": {
            "Paper 1": [
                "Physical World and Measurement", "Vector", "Newtonian Mechanics", 
                "Work, Energy and Power", "Gravitation", "Mechanical Properties of Matter", 
                "Oscillation", "Waves"
            ],
            "Paper 2": [
                "Thermal Physics", "Ideal Gas and Kinetic Theory", "Static Electricity",
                "Current Electricity", "Magnetic Effects of Current", "Electromagnetic Induction",
                "Alternating Current", "Geometrical Optics", "Physical Optics", "Modern Physics",
                "Semiconductor and Electronics"
            ]
        },
        "Chemistry": {
            "Paper 1": [
                "Laboratory Safety", "Qualitative Chemistry", "Quantitative Chemistry",
                "Atomic Structure", "Chemical Bond", "Periodic Table", "Chemical Change",
                "Industrial Chemistry"
            ],
            "Paper 2": [
                "Environmental Chemistry", "Organic Chemistry", "Hydrocarbons",
                "Alcohols, Phenols & Ethers", "Carbonyl Compounds", "Organic Acids and Derivatives",
                "Polymers", "Biochemistry"
            ]
        },
        "Higher Mathematics": {
            "Paper 1": [
                "Matrix and Determinant", "Straight Line", "Circle", "Permutation and Combination",
                "Trigonometric Ratios & Identities", "Trigonometric Equations", "Functions and Limits",
                "Differentiation"
            ],
            "Paper 2": [
                "Integration", "Differential Equations", "Vectors", "Three Dimensional Geometry",
                "Probability", "Complex Numbers", "Statistics"
            ]
        },
        "Biology": {
            "Paper 1 (Botany)": [
                "Cell Structure", "Cell Division", "Cell Chemistry", "Microorganism",
                "Algae & Fungi", "Bryophyta & Pteridophyta", "Gymnosperm & Angiosperm",
                "Plant Physiology"
            ],
            "Paper 2 (Zoology)": [
                "Animal Diversity", "Animal Tissue", "Digestion", "Respiration",
                "Circulation", "Excretion", "Nervous System", "Human Reproduction",
                "Genetics", "Evolution"
            ]
        },
        "ICT (Science)": {
            "Single Paper": [
                "ICT and Global Communication", "Communication Systems", "Number Systems & Digital Devices",
                "Web Design & HTML", "Programming Concepts", "Database Management", "ICT Ethics & Security"
            ]
        }
    },
    "BUSINESS STUDIES": {
        "Accounting": {
            "Paper 1": ["Introduction to Accounting", "Transactions", "Ledger", "Trial Balance", "Financial Statements"],
            "Paper 2": ["Partnership", "Company Accounts", "Cost Accounting", "Budget", "Financial Analysis"]
        },
        "Finance & Banking": {
            "Paper 1": ["Finance Introduction", "Time Value of Money", "Banking System", "Central Bank", "Commercial Bank"],
            "Paper 2": ["Insurance", "Capital Market", "Risk Management", "Financial Institutions", "International Trade Finance"]
        },
        "Business Organization & Management": {
            "Paper 1": ["Business Environment", "Ownership", "Management", "Organization", "Leadership"],
            "Paper 2": ["Human Resource Management", "Marketing", "Production", "Entrepreneurship", "Business Ethics"]
        },
        "ICT (Business)": {
            "Single Paper": [
                "ICT and Global Communication", "Communication Systems", "Number Systems & Digital Devices",
                "Web Design & HTML", "Programming Concepts", "Database Management", "ICT Ethics & Security"
            ]
        }
    },
    "HUMANITIES": {
        "Economics": {
            "Paper 1": ["Introduction to Economics", "Demand & Supply", "Production", "Market"],
            "Paper 2": ["National Income", "Money & Banking", "Inflation", "International Trade"]
        },
        "Civics & Good Governance": {
            "Paper 1": ["Civics Basics"], "Paper 2": ["Good Governance Basics"]
        },
        "History": {
            "Paper 1": ["Ancient History"], "Paper 2": ["Modern History"]
        },
        "Sociology": {
            "Paper 1": ["Sociology Basics"], "Paper 2": ["Social Changes"]
        },
        "Geography": {
            "Paper 1": ["Physical Geography"], "Paper 2": ["Human Geography"]
        },
        "Islamic History & Culture": {
            "Paper 1": ["Pre-Islamic Era"], "Paper 2": ["Islamic Empires"]
        },
        "Psychology": {
            "Paper 1": ["General Psychology"], "Paper 2": ["Developmental Psychology"]
        },
        "Social Work": {
            "Paper 1": ["Social Work Basics"], "Paper 2": ["Social Work Practice"]
        },
        "ICT (Humanities)": {
            "Single Paper": [
                "ICT and Global Communication", "Communication Systems", "Number Systems & Digital Devices",
                "Web Design & HTML", "Programming Concepts", "Database Management", "ICT Ethics & Security"
            ]
        }
    }
}

def create_hierarchy(db, group_name, subjects):
    group = models.Group(name=group_name)
    db.add(group)
    db.commit()
    db.refresh(group)
    
    for subj_name, papers in subjects.items():
        subject = models.Subject(name=subj_name, group_id=group.id)
        db.add(subject)
        db.commit()
        db.refresh(subject)
        
        for paper_name, chapters in papers.items():
            paper = models.Paper(name=paper_name, subject_id=subject.id)
            db.add(paper)
            db.commit()
            db.refresh(paper)
            
            for chapter_name in chapters:
                chapter = models.Chapter(name=chapter_name, paper_id=paper.id)
                db.add(chapter)
            db.commit()

def seed():
    # Drop all existing tables wiping the db without FK errors
    with engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        models.Base.metadata.drop_all(conn)
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))

    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("[SEED] Starting database full seed for HSC Curriculum...")

        # ---- Default Users ----
        admin = models.User(
            username="admin",
            email="admin@gradeup.com",
            hashed_password=hash_password("123"),
            role=models.UserRole.SUPERADMIN,
            stars=0,
            bio="Platform Super Administrator"
        )
        db.add(admin)

        moderator1 = models.User(
            username="moderator_demo",
            email="moderator@gradeup.com",
            hashed_password=hash_password("mod123"),
            role=models.UserRole.MODERATOR,
            stars=0,
            bio="Demo Moderator Account"
        )
        db.add(moderator1)

        moderator2 = models.User(
            username="mod_physics",
            email="mod_physics@gradeup.com",
            hashed_password=hash_password("mod123"),
            role=models.UserRole.MODERATOR,
            stars=0,
            bio="Physics Moderator Account"
        )
        db.add(moderator2)

        db.commit()
        db.refresh(moderator1)
        db.refresh(moderator2)

        print("  [INFO] Seeding Curriculum Hierarchy...")
        for group_name, subjects in hsc_curriculum.items():
            create_hierarchy(db, group_name, subjects)
            print(f"    - Seeded Group: {group_name}")

        # ---- Add some demo accumulated questions ----
        # Find Physics Chapter 1: Physical World and Measurement
        chapter = db.query(models.Chapter).filter(models.Chapter.name == "Physical World and Measurement").first()
        if chapter:
            q1 = models.Question(
                chapter_id=chapter.id,
                creator_id=moderator1.id,
                text="What is Newton's First Law of Motion?",
                option_a="An object in motion stays in motion unless acted upon by an external force",
                option_b="Force equals mass times acceleration",
                option_c="Every action has an equal and opposite reaction",
                option_d="Energy cannot be created or destroyed",
                correct_option="A",
                marks=1.0,
                difficulty=models.DifficultyLevel.EASY,
                status="active"
            )
            q2 = models.Question(
                chapter_id=chapter.id,
                creator_id=moderator2.id,
                text="What is the unit of electric current?",
                option_a="Volt",
                option_b="Ohm",
                option_c="Ampere",
                option_d="Watt",
                correct_option="C",
                marks=1.0,
                difficulty=models.DifficultyLevel.EASY,
                status="active"
            )
            db.add_all([q1, q2])
            db.commit()
            print("  [OK] 2 sample questions added to chapter by different moderators")

        print("[SUCCESS] Database completely seeded and ready for production!")

    except Exception as e:
        print(f"[ERROR] Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reply = input("WARNING: This will drop ALL existing tables and data! Type 'YES' to confirm: ")
    if reply == "YES":
        seed()
    else:
        print("Aborted.")
