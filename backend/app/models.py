from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False)  # Maps to "Simplified Muscle"
    specific_target = Column(String, nullable=True)  # Maps to "Specific Target Muscle"
    mechanics = Column(String, nullable=True)  # Maps to "Mechanics"
    exercise_type = Column(String, nullable=True)  # Maps to "Type"
    description = Column(String, nullable=True)  # Optional, kept for future use
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

