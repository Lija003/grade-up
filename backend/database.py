import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

logger = logging.getLogger("gradeup.database")

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Log the database URL safely (without password)
safe_url = SQLALCHEMY_DATABASE_URL
if "@" in SQLALCHEMY_DATABASE_URL:
    parts = SQLALCHEMY_DATABASE_URL.split("@")
    auth_part = parts[0].split("://")
    if len(auth_part) == 2 and ":" in auth_part[1]:
        safe_auth = f"{auth_part[0]}://{auth_part[1].split(':')[0]}:***"
        safe_url = f"{safe_auth}@{parts[1]}"
logger.info(f"Configuring database connection to: {safe_url}")

# Ensure strict MySQL usage or explicit SQLite logic only if explicitly configured
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Strict MySQL Configuration
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True, 
        pool_recycle=3600
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
