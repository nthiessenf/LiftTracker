from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base

# Database URL - update this to match your database configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./lifttrack.db"  # For SQLite, or use PostgreSQL URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}  # Only needed for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Create all database tables. Call this to recreate tables on app restart."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

