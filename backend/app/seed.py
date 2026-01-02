"""
Seed script to populate the database with initial exercise data.
Run this script to seed the database with exercises from seed_data.py
"""
from app.database import SessionLocal, init_db
from app.models import Exercise
from app.seed_data import initial_exercises


def seed_exercises():
    """Seed the exercises table with initial data."""
    # Initialize database (creates tables)
    init_db()
    
    db = SessionLocal()
    try:
        # Clear existing exercises (optional - comment out if you want to keep existing data)
        db.query(Exercise).delete()
        db.commit()
        
        # Add all exercises from seed_data
        for exercise_data in initial_exercises:
            exercise = Exercise(**exercise_data)
            db.add(exercise)
        
        db.commit()
        print(f"Successfully seeded {len(initial_exercises)} exercises")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_exercises()

