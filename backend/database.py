import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Use PostgreSQL if available, otherwise fall back to local SQLite for development
_pg_url = os.getenv("DATABASE_URL", "")

if _pg_url and _pg_url.startswith("postgresql"):
    DATABASE_URL = _pg_url
    connect_args = {}
else:
    # SQLite fallback — works on any machine without PostgreSQL
    DATABASE_URL = "sqlite:///./saferstreets.db"
    connect_args = {"check_same_thread": False}
    print("[SaferStreets DB] No PostgreSQL configured — using local SQLite database (saferstreets.db)")

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
