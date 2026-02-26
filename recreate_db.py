import os
import sys

# Ensure backend module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database import engine
from backend.models import Base

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Recreating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Database reset successfully! The HSC subjects will be populated automatically when you run the FastAPI server.")

if __name__ == "__main__":
    reset_database()
