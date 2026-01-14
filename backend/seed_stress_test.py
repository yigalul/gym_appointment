from database import SessionLocal, engine, Base
from models import User, Trainer, Availability, Appointment
from passlib.context import CryptContext
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def seed_stress_test():
    db = SessionLocal()
    try:
        logger.info("Cleaning up database...")
        # Delete existing data
        db.query(Appointment).delete()
        db.query(Availability).delete()
        db.query(Trainer).delete()
        db.query(User).delete()
        db.commit()

        logger.info("Creating Admin...")
        admin = User(email="admin@gym.com", hashed_password=get_password_hash("GymStrong2026!"), role="admin")
        db.add(admin)
        db.commit() # Commit to get ID
        db.refresh(admin)

        logger.info("Creating 6 Trainers...")
        trainers = []
        # Create 6 trainers, but only 3 will have availability
        for i in range(6):
            t_user = User(email=f"trainer{i+1}@gym.com", hashed_password=get_password_hash("GymStrong2026!"), role="trainer")
            db.add(t_user)
            db.commit()
            db.refresh(t_user)
            
            trainer = Trainer(user_id=t_user.id, name=f"Trainer {i+1}", role="Coach", bio="Stress Test Trainer", photo_url="")
            db.add(trainer)
            db.commit()
            db.refresh(trainer)
            trainers.append(trainer)

        logger.info("Setting Availability for ONLY 3 Trainers (Mon 9-12)...")
        # Trainers 1, 2, 3 have slots. Trainers 4, 5, 6 have NO slots.
        # Shift: Mon 09:00 - 12:00 (3 hours). 
        # Capacity per slot = 2 clients.
        # Total capacity per hour = 3 trainers * 2 clients = 6 clients.
        # Total capacity for 9:00 AM slot = 6 clients.
        
        for i in range(3): # First 3 trainers
            t = trainers[i]
            # Add slots for Mon 9am, 10am, 11am
            for hour in [9, 10, 11]:
                avail = Availability(
                    trainer_id=t.id, 
                    day_of_week=1, # Monday
                    start_time=f"{hour:02d}:00", 
                    end_time=f"{hour+1:02d}:00", 
                    is_recurring=True
                )
                db.add(avail)
        db.commit()

        logger.info("Creating 15 Clients...")
        # All 15 clients want Mon 9AM
        # Capacity is 6. So 9 should fail.
        for i in range(15):
            c_user = User(
                email=f"client{i+1}@test.com", 
                hashed_password=get_password_hash("GymStrong2026!"), 
                role="client",
                weekly_workout_limit=3,
                default_slots = [{"day_of_week": 1, "start_time": "09:00"}]
            )
            db.add(c_user)
        
        db.commit()
        logger.info("Stress Test Scenario Created Successfully!")
        logger.info("Summary:")
        logger.info("- 3 Active Trainers (Mon 9am)")
        logger.info("- 3 Inactive Trainers")
        logger.info("- 15 Clients requesting Mon 9am")
        logger.info("- Expected Result: ~6 Bookings, ~9 Failures")

    finally:
        db.close()

if __name__ == "__main__":
    seed_stress_test()
