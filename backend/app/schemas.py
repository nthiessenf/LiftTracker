from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ExerciseBase(BaseModel):
    name: str
    category: str
    specific_target: Optional[str] = None
    mechanics: Optional[str] = None
    exercise_type: Optional[str] = None
    description: Optional[str] = None


class ExerciseCreate(ExerciseBase):
    pass


class Exercise(ExerciseBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

