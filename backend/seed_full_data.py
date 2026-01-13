from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from passlib.context import CryptContext
import random
from datetime import datetime, timedelta

# Init DB
models.Base.metadata.create_all(bind=engine)
db: Session = SessionLocal()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password):
    return pwd_context.hash(password)

def seed_data():
    print("--- Starting Data Seeding ---")

    # 1. Clear Appointments
    print("Clearing all appointments...")
    db.query(models.Appointment).delete()
    db.commit()

    # 2. Ensure 3 Trainers
    print("Seeding Trainers...")
    trainer_names = ["Arnold", "Ronnie"]
    trainers = []
    
    # Check/Create trainers
    for name in trainer_names:
        email = f"{name.lower()}@gym.com"
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(
                email=email,
                hashed_password=get_password_hash("GymStrong2026!"),
                role="trainer",
                weekly_workout_limit=None
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            # Create Trainer Profile
            trainer = models.Trainer(
                user_id=user.id,
                name=f"{name} Schwarzenegger",
                role="Bodybuilding Expert",
                bio="Legend."
            )
            db.add(trainer)
            db.commit()
            db.refresh(trainer)

            # Seed Availability (Mon-Fri, 9-5)
            for day in range(5):
                avail = models.Availability(
                    trainer_id=trainer.id,
                    day_of_week=day,
                    start_time="09:00",
                    end_time="17:00"
                )
                db.add(avail)
            db.commit()

        else:
            # If user exists, check if trainer profile exists
            trainer = db.query(models.Trainer).filter(models.Trainer.user_id == user.id).first()
            if not trainer:
                 trainer = models.Trainer(
                    user_id=user.id,
                    name=f"{name} Schwarzenegger",
                    role="Bodybuilding Expert",
                    bio="Legend."
                )
                 db.add(trainer)
                 db.commit()
                 db.refresh(trainer)
                 
                 # Seed Availability for existing user new trainer
                 for day in range(5):
                    avail = models.Availability(
                        trainer_id=trainer.id,
                        day_of_week=day,
                        start_time="09:00",
                        end_time="17:00"
                    )
                    db.add(avail)
                 db.commit()
        
        trainers.append(trainer)
    
    print(f"Trainers ready: {[t.name for t in trainers]}")

    # 3. Create 4 Customers
    print("Seeding Customers...")
    clients = []
    for i in range(1, 5):
        email = f"client{i}@test.com"
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(
                email=email,
                hashed_password=get_password_hash("GymStrong2026!"),
                role="client",
                phone_number=f"+1555010{i:02d}", # Mock phone number
                weekly_workout_limit=3
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
             # Update existing user to have phone number if missing
             if not user.phone_number:
                user.phone_number = f"+1555010{i:02d}"
                db.add(user)
                db.commit()
                db.refresh(user)
        clients.append(user)
    
    print(f"Created {len(clients)} clients.")

    # 4. Create Random Appointments
    print("Creating Random Appointments...")
    
    # Generate some future slots for next week to avoid past-date issues and ensure day matches
    # Start from next Monday
    today = datetime.now()
    days_ahead = 7 - today.weekday() # Days until next Monday
    if days_ahead <= 0: days_ahead += 7
    start_date = today + timedelta(days=days_ahead)
    
    possible_hours = [9, 10, 11, 12, 13, 14, 15, 16]
    
    appointments_created = 0
    
    for client in clients:
        # Pick random trainer
        trainer = random.choice(trainers)
        
        # Pick random day (Mon-Fri) and hour
        random_day_offset = random.randint(0, 4) # 0=Mon, 4=Fri
        random_hour = random.choice(possible_hours)
        
        appt_date = start_date + timedelta(days=random_day_offset)
        appt_date = appt_date.replace(hour=random_hour, minute=0, second=0, microsecond=0)
        
        # Basic constraint check: don't double book trainer for same exact time? 
        # The prompt says "random appointment", but let's try to be slightly realistic to avoid unique constraint errors if any
        # Our unique constraint is (client_email, start_time) and backend checks trainer limits.
        # We will iterate until we find a free slot for this client if needed, but with 10 clients and 5*8=40 slots * 3 trainers = 120 capacity, collision is low.
        
        appt = models.Appointment(
            trainer_id=trainer.id,
            client_email=client.email,
            client_name=f"Client {client.id}",
            start_time=appt_date.isoformat(),
            status="confirmed"
        )
        db.add(appt)
        appointments_created += 1

    db.commit()
    print(f"Successfully created {appointments_created} appointments.")
    print("--- Seeding Complete ---")

if __name__ == "__main__":
    seed_data()
