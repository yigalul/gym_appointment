import os
import sys
from sqlalchemy import create_engine
from database import Base, SessionLocal
import models

# Ensure we're in the right directory context for imports
# This script assumes it's run from the project root using 'python3 backend/reset_and_seed_custom.py'
# but imports might need sys.path adjustment if run directly. 
# However, run_command sets Cwd, so relative imports in backend/ might need help if run as module.
# Let's assume run as 'python3 backend/reset_and_seed_custom.py' from root.
# Actually, since database.py and models.py are in backend/, we should run it as a script inside backend/
# OR append backend to path.

# sys.path hack not needed if we rely on CWD or if this script is robust.
# But let's verify imports work.
# If running 'python3 backend/reset_and_seed_custom.py' from root:
if os.getcwd() not in sys.path:
    sys.path.append(os.getcwd())

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "gym.db")

def reset_db():
    print(f"Target DB: {DB_PATH}")
    print(f"Removing {DB_PATH}...")
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print("Database file deleted.")
    else:
        print("No database file found to delete.")

    # Re-create engine/tables
    # We must re-import engine because it might have bound to the old file? 
    # SQLAlchemy engine bind is usually file path based, but safe to just proceed.
    # Actually, we should use the engine from database.py but ensuring it points to the right place.
    from database import engine
    
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    db = SessionLocal()
    
    try:
        # 1. Admin
        print("Seeding Admin...")
        admin = models.User(email="admin@gym.com", hashed_password="adminpassword", role="admin")
        db.add(admin)
        
        # 2. Trainers (2)
        print("Seeding 2 Trainers...")
        trainers_data = [
            {"email": "trainer1@gym.com", "name": "Trainer 1", "bio": "Bio 1"},
            {"email": "trainer2@gym.com", "name": "Trainer 2", "bio": "Bio 2"}
        ]
        
        for t in trainers_data:
            user = models.User(email=t['email'], hashed_password="password", role="trainer")
            db.add(user)
            db.flush() 
            
            trainer = models.Trainer(
                user_id=user.id,
                name=t['name'],
                role="Coach",
                bio=t['bio'],
                photo_url="https://via.placeholder.com/150"
            )
            db.add(trainer)

        # 3. Clients (4)
        print("Seeding 4 Clients...")
        for i in range(1, 5):
            email = f"client{i}@gym.com"
            client = models.User(
                email=email, 
                hashed_password="password", 
                role="client",
                weekly_workout_limit=3
            )
            db.add(client)

        db.commit()
        print("Seeding Complete.")
        
        # Verify
        u_count = db.query(models.User).count()
        t_count = db.query(models.Trainer).count()
        a_count = db.query(models.Appointment).count()
        
        print(f"\nStats:")
        print(f"Users: {u_count} (Expected 7: 1 Admin + 2 Trainers + 4 Clients)")
        print(f"Trainers: {t_count} (Expected 2)")
        print(f"Appointments: {a_count} (Expected 0)")

    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_db()
