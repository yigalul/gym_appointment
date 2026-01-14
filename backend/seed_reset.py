from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from passlib.context import CryptContext
import random
from datetime import datetime, timedelta
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Init DB
models.Base.metadata.create_all(bind=engine)
db: Session = SessionLocal()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password):
    return pwd_context.hash(password)

def seed_data():
    logger.info("--- Starting Data Reset and Seeding ---")

    # 1. Clear All Data (Order matters for foreign keys)
    logger.info("Clearing database...")
    db.query(models.Appointment).delete()
    db.query(models.ClientDefaultSlot).delete()
    db.query(models.Availability).delete()
    db.query(models.Trainer).delete()
    db.query(models.User).delete()
    db.commit()

    # 2. Create Admin
    logger.info("Creating Admin...")
    admin = models.User(
        email="admin@gym.com", 
        hashed_password=get_password_hash("GymStrong2026!"), 
        role="admin"
    )
    db.add(admin)
    db.commit()

    # 3. Create 2 Trainers
    logger.info("Seeding 2 Trainers...")
    trainers_data = [
        {"name": "Sarah Connor", "role": "Strength Coach", "email": "sarah@gym.com"},
        {"name": "Mike Mentzer", "role": "High Intensity Expert", "email": "mike@gym.com"}
    ]
    
    trainers = []
    for t_data in trainers_data:
        user = models.User(
            email=t_data["email"],
            hashed_password=get_password_hash("GymStrong2026!"),
            role="trainer"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        trainer_profile = models.Trainer(
            user_id=user.id,
            name=t_data["name"],
            role=t_data["role"],
            bio="Experienced trainer."
        )
        db.add(trainer_profile)
        db.commit()
        db.refresh(trainer_profile)
        trainers.append(trainer_profile)
        
        # Availability (Mon-Fri 09:00-17:00)
        for day in range(5):
            avail = models.Availability(
                trainer_id=trainer_profile.id,
                day_of_week=day,
                start_time="09:00",
                end_time="17:00"
            )
            db.add(avail)
        db.commit()

    # 4. Create 5 Clients
    logger.info("Seeding 5 Clients...")
    client_emails = [
        "alice@gym.com", 
        "bob@gym.com", 
        "charlie@gym.com", 
        "dave@gym.com", 
        "eve@gym.com"
    ]
    
    clients = []
    for email in client_emails:
        user = models.User(
            email=email,
            hashed_password=get_password_hash("GymStrong2026!"),
            role="client",
            weekly_workout_limit=3
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        clients.append(user)

    # 4b. Create Default Slots for Clients (Conflict Scenario)
    logger.info("Seeding Default Slots (All Sunday 10:00)...")
    
    # All clients want Sunday 10:00
    for client in clients:
        db.add(models.ClientDefaultSlot(user_id=client.id, day_of_week=6, start_time="10:00"))
    
    db.commit()
        
    # 5. Create Random Appointments (optional but good for testing)
    logger.info("Creating Random Appointments (1 per client)...")
    today = datetime.now()
    days_ahead = 7 - today.weekday() # Next Monday
    if days_ahead <= 0: days_ahead += 7
    start_date = today + timedelta(days=days_ahead)
    
    for i, client in enumerate(clients):
        trainer = trainers[i % 2] # Distribute between 2 trainers
        appt_date = start_date + timedelta(days=(i % 5)) # Spread across M-F
        appt_date = appt_date.replace(hour=10, minute=0, second=0, microsecond=0)
        
        appt = models.Appointment(
            trainer_id=trainer.id,
            client_email=client.email,
            client_name=f"Client {client.email.split('@')[0]}",
            start_time=appt_date.isoformat(),
            status="confirmed"
        )
        db.add(appt)
    db.commit()
    
    logger.info("--- Database Reset & Seeded Successfully ---")

if __name__ == "__main__":
    seed_data()
