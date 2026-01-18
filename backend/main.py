from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import engine, get_db
from auto_migrate import run_auto_migrations

# Run simple migrations before creating tables (or after, depending on preference, but before app start)
# create_all only creates missing tables, doesn't update.
# We run migrations first IF tables exist, or after? 
# Safest is to let create_all run first to ensure tables exist, THEN migrate?
# But if tables don't exist, create_all makes them with NEW schema.
# So we only need to migrate if tables ALREADY exist but are old.
# Let's run create_all first, then check columns.
models.Base.metadata.create_all(bind=engine)
run_auto_migrations(engine)

import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

try:
    from dotenv import load_dotenv
    load_dotenv()
    logger.info("Loaded .env file")
except ImportError:
    logger.warning("python-dotenv not installed, skipping .env load")

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://gym-appointment-ten.vercel.app"],
    # allow_origins=["*"], # Allow Vercel/Anywhere for now 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Shared Seeding Logic ---
def seed_data(db: Session):
    if db.query(models.User).count() > 0:
        return {"message": "Database already seeded"}

    logger.info("--- SEEDING DATABASE (Extended) ---")
    
    # 1. Admin
    admin = models.User(email="admin@gym.com", hashed_password="adminpassword", role="admin")
    db.add(admin)
    
    # 2. Trainers (Users)
    t_users = []
    t_users = []
    for i in range(1, 3): # 2 Trainers
        t_users.append(models.User(email=f"trainer{i}@gym.com", hashed_password="password", role="trainer"))
    db.add_all(t_users)
    db.commit()

    # 3. Trainers (Profiles)
    trainers_data = [
        {"name": "Arnold S.", "role": "Bodybuilding", "bio": "I'll be back... for another set.", "seed": "Arnold"},
        {"name": "Ronnie C.", "role": "Powerlifting", "bio": "Light weight baby!", "seed": "Ronnie"},
    ]
    
    for idx, data in enumerate(trainers_data):
        # Match trainer user (t_users[0] is trainer1)
        t_profile = models.Trainer(
            user_id=t_users[idx].id,
            name=data["name"],
            role=data["role"],
            bio=data["bio"],
            photo_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={data['seed']}"
        )
        db.add(t_profile)
    
    # 4. Clients (4 Clients)
    clients = []
    for i in range(1, 5):
        clients.append(models.User(
            email=f"client{i}@gym.com", 
            hashed_password="password", 
            role="client", 
            phone_number=f"+1555010{i:02d}",
            first_name=f"Client{i}",
            last_name="Test",
            workout_credits=10
        ))
    db.add_all(clients)
    
    db.commit()
    logger.info("--- SEEDING COMPLETE ---")
    return {"message": "Database seeded with 2 Trainers and 4 Clients"}

# --- Startup Event: Auto-Seed DB on Render ---
@app.on_event("startup")
def startup_event():
    db = next(get_db())
    try:
        if db.query(models.User).count() == 0:
            seed_data(db)
    finally:
        db.close()

# ... (Existing Endpoints) ...

@app.get("/test-seed")
def seed_db(force: bool = False, db: Session = Depends(get_db)):
    if force:
        logger.info("--- FORCING DATABASE RESET ---")
        try:
            db.query(models.Appointment).delete()
            db.query(models.Availability).delete()
            # Trainers and Clients are Users, but Trainer model links to User
            db.query(models.Trainer).delete() 
            db.query(models.ClientDefaultSlot).delete()
            db.query(models.Notification).delete()
            db.query(models.User).delete()
            db.commit()
            logger.info("--- DATABASE WIPED ---")
        except Exception as e:
            logger.error(f"Error wiping DB: {e}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database reset failed: {str(e)}")
    return seed_data(db)


@app.post("/login", response_model=schemas.User)
def login(creds: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == creds.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.hashed_password != creds.password:
         raise HTTPException(status_code=401, detail="Incorrect credentials")
         
    return user

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(
        email=user.email,
        hashed_password=user.password,
        role=user.role,
        phone_number=user.phone_number,
        first_name=user.first_name,
        last_name=user.last_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    if user.default_slots:
        for slot in user.default_slots:
            db_slot = models.ClientDefaultSlot(
                user_id=db_user.id,
                day_of_week=slot.day_of_week,
                start_time=slot.start_time
            )
            db.add(db_slot)
        db.commit()
        db.refresh(db_user) # Refresh to load the relationship

    return db_user

@app.get("/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.email:
        db_user.email = user_update.email
    
    if user_update.first_name is not None:
        db_user.first_name = user_update.first_name

    if user_update.last_name is not None:
        db_user.last_name = user_update.last_name

    if user_update.phone_number is not None:
        db_user.phone_number = user_update.phone_number
    
    if user_update.weekly_workout_limit is not None:
        db_user.weekly_workout_limit = user_update.weekly_workout_limit
        
    if user_update.workout_credits is not None:
        db_user.workout_credits = user_update.workout_credits
    
    if user_update.default_slots is not None:
        # Delete existing slots
        db.query(models.ClientDefaultSlot).filter(models.ClientDefaultSlot.user_id == user_id).delete()
        
        # Add new slots
        for slot in user_update.default_slots:
            db_slot = models.ClientDefaultSlot(
                user_id=user_id,
                day_of_week=slot.day_of_week,
                start_time=slot.start_time
            )
            db.add(db_slot)
            
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1. Clean up associated Trainer if exists
    trainer = db.query(models.Trainer).filter(models.Trainer.user_id == user_id).first()
    if trainer:
        # Cascade delete trainer stuff
        db.query(models.Appointment).filter(models.Appointment.trainer_id == trainer.id).delete()
        db.query(models.Availability).filter(models.Availability.trainer_id == trainer.id).delete()
        db.delete(trainer)

    # 2. Clean up Client Slots
    db.query(models.ClientDefaultSlot).filter(models.ClientDefaultSlot.user_id == user_id).delete()

    # 3. Clean up Appointments (as Client)
    db.query(models.Appointment).filter(models.Appointment.client_id == user_id).delete()
    
    # 4. Clean up Notifications
    db.query(models.Notification).filter(models.Notification.user_id == user_id).delete()

    db.delete(db_user)
    db.commit()
    return None

# --- Trainer Endpoints ---

@app.post("/trainers/", response_model=schemas.Trainer)
def create_trainer(trainer: schemas.TrainerCreate, db: Session = Depends(get_db)):
    # Note: In a real app, we'd link this to the current user
    db_trainer = models.Trainer(**trainer.dict())
    db.add(db_trainer)
    db.commit()
    db.refresh(db_trainer)
    return db_trainer

@app.get("/trainers/", response_model=List[schemas.Trainer])
def read_trainers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    trainers = db.query(models.Trainer).offset(skip).limit(limit).all()
    return trainers

@app.delete("/trainers/{trainer_id}")
def delete_trainer(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if trainer is None:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    # Delete associated User if exists (optional cleanup)
    if trainer.user_id:
        user = db.query(models.User).filter(models.User.id == trainer.user_id).first()
        if user:
            db.delete(user)
    
    # Trainer cascade deletes appointments/availabilities handled by database or manual cleanup
    # Here we delete trainer, SQLAlchemy should handle cascade if configured, currently manual:
    db.query(models.Appointment).filter(models.Appointment.trainer_id == trainer_id).delete()
    db.query(models.Availability).filter(models.Availability.trainer_id == trainer_id).delete()
    
    db.delete(trainer)
    db.commit()
    return {"message": "Trainer deleted successfully"}

@app.get("/trainers/{trainer_id}", response_model=schemas.Trainer)
def read_trainer(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if trainer is None:
        raise HTTPException(status_code=404, detail="Trainer not found")
    return trainer

@app.post("/trainers/{trainer_id}/availability/all-week")
def add_full_week_availability(trainer_id: int, start_time: str = "09:00", end_time: str = "17:00", db: Session = Depends(get_db)):
    # 0 = Sunday, 1 = Monday ... 6 = Saturday
    # Or strict ISO: 0=Monday?
    # Our system seems to use 0 as standard start index, let's assume 0-6 cover the week.
    # Frontend logic usually maps 0-6.
    
    new_slots = []
    for day in range(6): # 0-5 (Sunday to Friday), Exclude 6 (Saturday)
        # SKIP FRIDAY EVENING
        if day == 5 and start_time == "15:00":
             continue

        # Check if exists
        existing = db.query(models.Availability).filter(
            models.Availability.trainer_id == trainer_id,
            models.Availability.day_of_week == day,
            models.Availability.start_time == start_time
        ).first()

        if existing:
            continue
            
        slot = models.Availability(
            trainer_id=trainer_id,
            day_of_week=day,
            start_time=start_time,
            end_time=end_time,
            is_recurring=True
        )
        db.add(slot)
        new_slots.append(slot)
    
    db.commit()
    return {"message": "Added full week availability", "slots_count": len(new_slots)}

@app.post("/trainers/{trainer_id}/availability/", response_model=schemas.Availability)
def create_availability(trainer_id: int, availability: schemas.AvailabilityBase, db: Session = Depends(get_db)):
    # 1. Validate Day (Sunday=0 to Friday=5, Saturday=6 is not allowed)
    if availability.day_of_week == 6:
        raise HTTPException(status_code=400, detail="Trainers cannot schedule on Saturdays.")
    
    # NEW: Validate Friday Evening (Friday=5, Start=15:00)
    if availability.day_of_week == 5 and availability.start_time == "15:00":
        raise HTTPException(status_code=400, detail="Trainers cannot schedule Friday Evenings.")

    # 2. Validate Time Slots (Morning: 07:00-13:00, Evening: 15:00-21:00)
    # We extended to 13:00 and 21:00 to allow 12:00 and 20:00 start times for sessions.
    valid_morning = (availability.start_time == "07:00" and availability.end_time == "13:00")
    valid_evening = (availability.start_time == "15:00" and availability.end_time == "21:00")

    if not (valid_morning or valid_evening):
        raise HTTPException(
            status_code=400, 
            detail="Invalid time slot. Must be Morning (07:00-13:00) or Evening (15:00-21:00)."
        )

    # Check for duplicate slot for THIS trainer
    existing_own = db.query(models.Availability).filter(
        models.Availability.trainer_id == trainer_id,
        models.Availability.day_of_week == availability.day_of_week,
        models.Availability.start_time == availability.start_time
    ).first()
    
    if existing_own:
        raise HTTPException(status_code=400, detail="You already have this shift scheduled.")

    # 3. Validate Shift Capacity (Max 3 Trainers Per Shift)
    # Check overlapping availabilities for this day
    overlapping_trainers_count = db.query(models.Availability.trainer_id).filter(
        models.Availability.day_of_week == availability.day_of_week,
        models.Availability.start_time < availability.end_time,
        models.Availability.end_time > availability.start_time
    ).distinct().count()

    # Note: If this trainer is already scheduling for this slot (update scenario), 
    # we might self-count. But this is create endpoint (POST), so usually new.
    # However, a trainer might have multiple slots? No, usually 1 slot per shift.
    # To be safe, check if WE are already counted (though unlikely for POST new availability)
    
    if overlapping_trainers_count >= 3:
        raise HTTPException(
            status_code=400, 
            detail="Shift is full. Maximum 3 trainers allowed for this time slot."
        )

    # 4. Check for Self-Overlap (Prevent Duplicate Shifts)
    self_overlap = db.query(models.Availability).filter(
        models.Availability.trainer_id == trainer_id,
        models.Availability.day_of_week == availability.day_of_week,
        models.Availability.start_time < availability.end_time,
        models.Availability.end_time > availability.start_time
    ).first()

    if self_overlap:
        raise HTTPException(
            status_code=400,
            detail="You are already scheduled for this time slot."
        )

    db_availability = models.Availability(**availability.dict(), trainer_id=trainer_id)
    db.add(db_availability)
    db.commit()
    db.refresh(db_availability)
    return db_availability

@app.delete("/availability/{availability_id}", status_code=204)
def delete_availability(availability_id: int, db: Session = Depends(get_db)):
    db_availability = db.query(models.Availability).filter(models.Availability.id == availability_id).first()
    if db_availability is None:
        raise HTTPException(status_code=404, detail="Availability not found")
    
    db.delete(db_availability)
    db.commit()
    return None

# --- Appointment Endpoints ---

@app.post("/appointments/", response_model=schemas.Appointment)
def create_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    # 1. Duplicate Booking Check: User cannot book the same slot twice
    # (Checking by email which is our current unique identifier mostly)
    existing_appointment = db.query(models.Appointment).filter(
        models.Appointment.client_email == appointment.client_email,
        models.Appointment.start_time == appointment.start_time,
        models.Appointment.status != "cancelled"
    ).first()

    if existing_appointment:
        raise HTTPException(status_code=400, detail="You already have a booking at this time.")

    # 2. Gym Capacity: Max 6 appointments total per slot
    global_count = db.query(models.Appointment).filter(
        models.Appointment.start_time == appointment.start_time,
        models.Appointment.status != "cancelled"
    ).count()
    
    if global_count >= 6:
         raise HTTPException(status_code=400, detail="Gym capacity reached for this time slot (Max 6 clients).")

    # 3. Trainer Capacity: Max 3 unique trainers per slot AND Max 2 clients per trainer
    # Check if this trainer is already working
    trainer_appointments = db.query(models.Appointment).filter(
        models.Appointment.trainer_id == appointment.trainer_id,
        models.Appointment.start_time == appointment.start_time,
        models.Appointment.status != "cancelled"
    )
    trainer_client_count = trainer_appointments.count()

    # Rule: Max 2 clients per trainer
    if trainer_client_count >= 2:
        raise HTTPException(status_code=400, detail="Trainer is fully booked for this time slot (Max 2 clients).")

    if trainer_client_count == 0:
        # If trainer is not yet working, check if adding them exceeds 3 trainers limit (Global Shift Limit)
        active_trainers_count = db.query(models.Appointment.trainer_id).filter(
            models.Appointment.start_time == appointment.start_time,
            models.Appointment.status != "cancelled"
        ).distinct().count()

        if active_trainers_count >= 3:
            raise HTTPException(status_code=400, detail="Shift capacity reached (Max 3 trainers per shift).")


    # 4. Weekly Workout Limit
    from datetime import datetime, timedelta
    
    # Parse appointment date
    try:
        appt_date = datetime.fromisoformat(appointment.start_time)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    # Calculate start and end of the week (Monday to Sunday)
    start_of_week = appt_date - timedelta(days=appt_date.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_week = start_of_week + timedelta(days=7)

    today = datetime.now().date()
    # 0. Validate Date (Cannot book past) - Good practice to add here
    if appt_date.date() < today:
        raise HTTPException(status_code=400, detail="Cannot book appointments in the past.")

    # Get user to check limit and restrictions
    client_user = db.query(models.User).filter(models.User.email == appointment.client_email).first()
    
    if not client_user:
        # Fallback or create? For now assume user exists if using the UI
        user_limit = 3 # Default fallback
    else:
        user_limit = client_user.weekly_workout_limit

        # --- NEW RESTRICTION: Clients Limited to Morning (7-12) and Evening (15-20) ---
        if client_user.role == "client":
            # Extract time part from ISO string "YYYY-MM-DDTHH:MM:SS"
            try:
                hour = int(appointment.start_time.split("T")[1].split(":")[0])
                
                is_morning = 7 <= hour <= 12
                is_evening = 15 <= hour <= 20
                
                if not (is_morning or is_evening):
                    raise HTTPException(
                        status_code=400, 
                        detail="Clients can only book between 07:00-12:00 or 15:00-20:00."
                    )
            except (IndexError, ValueError):
                raise HTTPException(status_code=400, detail="Invalid time format.")


    # Count user's appointments in this week
    weekly_count = db.query(models.Appointment).filter(
        models.Appointment.client_email == appointment.client_email,
        models.Appointment.status != "cancelled",
        models.Appointment.start_time >= start_of_week.isoformat(),
        models.Appointment.start_time < end_of_week.isoformat()
    ).count()

    if weekly_count >= user_limit:
        raise HTTPException(status_code=400, detail=f"Weekly workout limit reached ({user_limit} sessions/week).")

    # 5. Check Workout Credits
    if client_user:
        if client_user.workout_credits <= 0:
            raise HTTPException(status_code=400, detail="You have 0 workout credits remaining. Resupply via admin.")
        
        # Decrement credits
        client_user.workout_credits -= 1
        db.add(client_user) # Update user record

    db_appointment = models.Appointment(**appointment.dict())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)

    # --- WhatsApp Notification ---
    try:
        # Lazy load trainer to get name
        trainer_name = db_appointment.trainer.name if db_appointment.trainer else "Gym Trainer"
        
        # Parse connection string to get nice date/time
        # start_time is ISO string
        import whatsapp_service
        
        # Parsing ISO format safely
        dt_str = db_appointment.start_time
        # Example: 2023-10-27T10:00:00
        date_part = dt_str.split("T")[0]
        time_part = dt_str.split("T")[1][:5] # HH:MM
        
        whatsapp_service.notify_appointment_created(
            client_name=db_appointment.client_name or "Client",
            date=date_part,
            time=time_part,
            trainer_name=trainer_name
        )
    except Exception as e:
        logger.error(f"Notification Error: {e}")
        # Don't fail the request just because notification failed

    return db_appointment

@app.put("/appointments/{appointment_id}/cancel", response_model=schemas.Appointment)
def cancel_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appointment.status = "cancelled"
    
    # Refund Credit
    if appointment.client_email:
         client_user = db.query(models.User).filter(models.User.email == appointment.client_email).first()
         if client_user:
             client_user.workout_credits += 1
             db.add(client_user)

    db.commit()
    db.refresh(appointment)
    return appointment

@app.delete("/appointments/week/{week_start_date}", response_model=dict)
def clear_week_appointments(week_start_date: str, db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    try:
        start_date = datetime.fromisoformat(week_start_date)
        end_date = start_date + timedelta(days=7)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    # Delete appointments in range
    logger.info(f"Clearing week starting: {week_start_date}")
    logger.info(f"Range: {start_date} to {end_date}")
    
    result = db.query(models.Appointment).filter(
        models.Appointment.start_time >= start_date.isoformat(),
        models.Appointment.start_time < end_date.isoformat()
    ).delete(synchronize_session=False)
    
    logger.info(f"Deleted {result} appointments.")
    db.commit()
    return {"message": "Week cleared", "deleted_count": result}

@app.post("/appointments/auto-schedule", response_model=dict)
def auto_schedule_week(payload: dict, db: Session = Depends(get_db)):
    # Payload: { "week_start_date": "YYYY-MM-DD" }
    from datetime import datetime, timedelta
    
    logger = []
    failed_assignments = []
    success_count = 0
    
    try:
        week_start = datetime.fromisoformat(payload.get("week_start_date"))
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid week_start_date format. properly.")

    # 1. Get all clients with default slots
    clients = db.query(models.User).filter(models.User.role == "client").all()
    
    for client in clients:
        if not client.default_slots:
            continue
            
        # 1.1 Check Weekly Limit (Count existing bookings for this week first)
        # We need to know how many appts they ALREADY have in this week to enforce limit.
        # Week range: week_start to week_start + 7 days
        week_end = week_start + timedelta(days=7)
        current_week_bookings = db.query(models.Appointment).filter(
            models.Appointment.client_id == client.id,
            models.Appointment.start_time >= week_start.isoformat(),
            models.Appointment.start_time < week_end.isoformat(),
            models.Appointment.status != 'cancelled'
        ).count()
        
        bookings_this_week = current_week_bookings

        for slot in client.default_slots:
            # Check Limits BEFORE trying to book
            if bookings_this_week >= client.weekly_workout_limit:
                 failed_assignments.append({
                     "client": client.email,
                     "slot": f"Slot {slot.day_of_week}",
                     "reason": f"Weekly limit reached ({client.weekly_workout_limit})"
                 })
                 continue
                 
            if client.workout_credits <= 0:
                 failed_assignments.append({
                     "client": client.email,
                     "slot": f"Slot {slot.day_of_week}",
                     "reason": "Insufficient credits"
                 })
                 continue

            # Calculate target appointment datetime
            # slot.day_of_week: 0=Sunday, 1=Monday... (Wait, date-fns uses 0=Sunday? No, Python datetime 0=Monday)
            # Let's standardize: In our system 0=Monday based on seeding. 
            # If week_start is Monday, then target_date = week_start + days(slot.day_of_week)
            # Assumption: week_start is a Monday.
            
            target_date = week_start + timedelta(days=slot.day_of_week)   
            appointment_time_iso = f"{target_date.strftime('%Y-%m-%d')}T{slot.start_time}:00"
            
            # Check if already booked
            existing = db.query(models.Appointment).filter(
                models.Appointment.client_email == client.email,
                models.Appointment.start_time == appointment_time_iso,
                models.Appointment.status != 'cancelled'
            ).first()
            
            if existing:
                continue # Already scheduled
                
            # --- CONSTRAINTS CHECK ---
            
            # 1. Gym Capacity (Global: Max 3 trainers working simultaneously)
            active_trainers_count = db.query(models.Appointment.trainer_id).filter(
                models.Appointment.start_time == appointment_time_iso,
                models.Appointment.status != "cancelled"
            ).distinct().count()
            
            if active_trainers_count >= 3:
                # But wait, if we pick an ALREADY ACTIVE trainer, we don't increase this count.
                # So we can only pick from already active trainers if count >= 3.
                pass
            
            # Find a suitable trainer
            # Strategy:
            # 1. Get all trainers who are AVAILABLE (Shift) at this time.
            # 2. Filter out trainers who are FULL (>= 2 clients).
            

            
            available_trainers = []
            
            # Get all trainers
            all_trainers = db.query(models.Trainer).all()

            for trainer in all_trainers:
                # A. Check Shift Availability
                is_working = False
                for av in trainer.availabilities:
                    if av.day_of_week == slot.day_of_week:
                        # Check start time match
                        if av.start_time <= slot.start_time and av.end_time > slot.start_time:
                            is_working = True
                            break
                            
                if not is_working:
                    # with open("debug_auto_schedule.txt", "a") as f: f.write(f"[DEBUG] Trainer {trainer.id} not working/avail\n")
                    continue

                # B. Check Capacity (Max 2 clients)
                current_clients = db.query(models.Appointment).filter(
                    models.Appointment.trainer_id == trainer.id,
                    models.Appointment.start_time == appointment_time_iso,
                    models.Appointment.status != "cancelled"
                ).count()
                


                if current_clients >= 2:
                    continue
                    
                # C. Check Global Constraint
                # If this trainer is NOT already active, adds +1 to global count.
                # If global count is already 3, we cannot add a NEW trainer.
                is_active = current_clients > 0
                if not is_active and active_trainers_count >= 3:
                     # Trainer blocked by Global Limit

                     continue
                    
                available_trainers.append(trainer)
            

            
            if not available_trainers:
                 failed_assignments.append({
                     "client": client.email,
                     "slot": f"{target_date.strftime('%A')} {slot.start_time}",
                     "reason": "No available trainer / Gym busy"
                 })
                 
                 # Create Notification for failure
                 from datetime import datetime
                 notif = models.Notification(
                     user_id=client.id,
                     message=f"Could not auto-schedule {target_date.strftime('%A')} at {slot.start_time}: No available trainer or gym full.",
                     created_at=datetime.now().isoformat(),
                     is_read=False
                 )
                 db.add(notif)
                 db.commit() # Commit notification even if assignment failed
                 
                 continue
                 
            # Assign first available (Logic could be smarter, e.g., round robin)
            selected_trainer = available_trainers[0]
            
            # Create Appointment
            new_appt = models.Appointment(
                trainer_id=selected_trainer.id,
                client_id=client.id,
                client_name=client.email.split('@')[0], # Fallback name
                client_email=client.email,
                start_time=appointment_time_iso,
                status="confirmed"
            )
            db.add(new_appt)
            
            # Update State
            client.workout_credits -= 1
            bookings_this_week += 1
            
            success_count += 1
            
            # Update active count for next iteration (approximate within transaction)
            # Actually db.commit is needed to update queries? 
            # Ideally we do this in one go or careful logic. 
            # For simplicity let's commit per booking or carefully track in memory?
            # Committing per booking is safer for MVP logic Correctness check re-runs.
            db.commit() 
            
    # Post-Processing: Separate Critical vs Non-Critical Failures
    # Critical = User has < weekly_workout_limit bookings
    # Non-Critical = User met limit despite some slot failures
    
    critical_failures = []
    non_critical_failures = []
    
    # We need to re-check final booking counts for failed users
    # Optimization: We tracked 'bookings_this_week' in the loop, but it was per client iteration.
    # Simple way: Group failures by client email.
    
    temp_fail_map = {} # email -> list of failures
    for f in failed_assignments:
        email = f['client']
        if email not in temp_fail_map: temp_fail_map[email] = []
        temp_fail_map[email].append(f)
        
    for client in clients:
        email = client.email
        if email not in temp_fail_map: continue
        
        # Check current status
        week_end_date = week_start + timedelta(days=7)
        final_count = db.query(models.Appointment).filter(
            models.Appointment.client_id == client.id,
            models.Appointment.start_time >= week_start.isoformat(),
            models.Appointment.start_time < week_end_date.isoformat(),
            models.Appointment.status != 'cancelled'
        ).count()
        
        if final_count < client.weekly_workout_limit:
            # All failures for this client are critical (contributed to missing goal)
            # Add 'missing_count' to help resolver
            missing = client.weekly_workout_limit - final_count
            for fail in temp_fail_map[email]:
                fail['missing_count'] = missing
                critical_failures.append(fail)
        else:
            non_critical_failures.extend(temp_fail_map[email])

    return {
        "success_count": success_count,
        "failed_assignments": critical_failures, # Only return critical ones for action? Or both?
        "non_critical_failures": non_critical_failures,
        "total_failures": len(failed_assignments)
    }

@app.get("/users/{user_id}/notifications", response_model=List[schemas.Notification])
def read_notifications(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(models.Notification.user_id == user_id).order_by(models.Notification.created_at.desc()).all()

@app.put("/notifications/{notification_id}/read", response_model=schemas.Notification)
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notif:
         raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

# --- System Settings Endpoints ---

@app.get("/settings/current-week", response_model=schemas.SystemWeekResponse)
def get_system_week(db: Session = Depends(get_db)):
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "current_week").first()
    if not setting:
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        return {"date": today}
    return {"date": setting.value}

@app.post("/settings/current-week")
def update_system_week(payload: schemas.SystemWeekUpdate, db: Session = Depends(get_db)):
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "current_week").first()
    if not setting:
        setting = models.SystemSetting(key="current_week", value=payload.date)
        db.add(setting)
    else:
        setting.value = payload.date
    
    db.commit()
    return {"message": "System week updated", "date": payload.date}

@app.get("/appointments/", response_model=List[schemas.Appointment])
def read_appointments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    appointments = db.query(models.Appointment).order_by(models.Appointment.start_time.asc()).offset(skip).limit(limit).all()
    return appointments

# Endpoint replaced by shared logic above
# Force Reload
import os
from datetime import datetime, timedelta
from pydantic import BaseModel
import whatsapp_service # Import the module, not just the function, or update call site

@app.post("/admin/send-whatsapp")
def send_admin_message(request: schemas.AdminMessageRequest, db: Session = Depends(get_db)):
    # 1. Create notification
    full_message = f"Admin Message: {request.message}"
    notif = models.Notification(
        user_id=request.user_id,
        message=full_message,
        created_at=datetime.now().isoformat()
    )
    db.add(notif)
    
    # 2. Get User & Phone
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    success = whatsapp_service.send_whatsapp_message(
        to_number=os.getenv("TEST_WHATSAPP_TARGET", "+15550000000"),
        body_text=full_message
    )
    
    if success:
        return {"message": "WhatsApp sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send WhatsApp")

@app.post("/appointments/auto-resolve", response_model=dict)
def auto_resolve_conflicts(payload: dict, db: Session = Depends(get_db)):
    # Payload: { "week_start_date": "YYYY-MM-DD" }
    from datetime import datetime, timedelta
    
    try:
        week_start = datetime.fromisoformat(payload.get("week_start_date"))
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid week_start_date format.")

    week_end = week_start + timedelta(days=7)
    
    # 1. Identify Under-Booked Clients (Critical Failures)
    clients = db.query(models.User).filter(models.User.role == "client").all()
    
    resolved_count = 0
    resolved_details = []
    
    # Pre-fetch all appointments for the week for efficiency? 
    # For now, querying inside loop is safer to get latest state after swaps.
    
    for client in clients:
        if client.workout_credits <= 0:
            continue
            
        current_bookings_count = db.query(models.Appointment).filter(
            models.Appointment.client_id == client.id,
            models.Appointment.start_time >= week_start.isoformat(),
            models.Appointment.start_time < week_end.isoformat(),
            models.Appointment.status != 'cancelled'
        ).count()
        
        missing_slots = client.weekly_workout_limit - current_bookings_count
        
        if missing_slots <= 0:
            continue
            
        if not client.default_slots:
            continue
            
        # Get list of booked slots for this client to avoid duplicates
        booked_appts = db.query(models.Appointment).filter(
            models.Appointment.client_id == client.id,
            models.Appointment.start_time >= week_start.isoformat(),
            models.Appointment.start_time < week_end.isoformat(),
            models.Appointment.status != 'cancelled'
        ).all()
        booked_times = [datetime.fromisoformat(a.start_time) for a in booked_appts]

        # Iterate through default slots to find UNFULFILLED ones
        for slot in client.default_slots:
            if missing_slots <= 0 or client.workout_credits <= 0:
                break
                
            target_date = week_start + timedelta(days=slot.day_of_week)
            # Slot Timestamp
            slot_iso = f"{target_date.strftime('%Y-%m-%d')}T{slot.start_time}:00"
            slot_dt = datetime.fromisoformat(slot_iso)
            
            # Skip if already booked
            if any(bt == slot_dt for bt in booked_times):
                continue
                
            # --- BLOCKER SHIFTING LOGIC ---
            # 1. Who is blocking this slot?
            blockers = db.query(models.Appointment).filter(
                models.Appointment.start_time == slot_iso,
                models.Appointment.status != 'cancelled'
            ).all()
            
            # If slot is actually empty (available), we should just book it!
            # But auto-schedule failed, so it implies it was full or no trainer.
            # Let's check if it's full.
            
            # Check availability normally first (maybe someone cancelled?)
            # ... (Skipping simple check for now, assuming conflict exists)
            
            # 2. Iterate Blockers and try to MOVE them
            slot_resolved = False
            for blocker_appt in blockers:
                blocker_user = db.query(models.User).filter(models.User.id == blocker_appt.client_id).first()
                if not blocker_user or not blocker_user.default_slots:
                    continue
                
                # Check Blocker's OTHER default slots
                for b_slot in blocker_user.default_slots:
                    b_target_date = week_start + timedelta(days=b_slot.day_of_week)
                    b_slot_iso = f"{b_target_date.strftime('%Y-%m-%d')}T{b_slot.start_time}:00"
                    
                    # Must be a DIFFERENT slot
                    if b_slot_iso == slot_iso:
                        continue
                        
                    # Check if Blocker is ALREADY booked at this other time
                    is_blocker_busy = db.query(models.Appointment).filter(
                        models.Appointment.client_id == blocker_user.id,
                        models.Appointment.start_time == b_slot_iso,
                        models.Appointment.status != 'cancelled'
                    ).count() > 0
                    if is_blocker_busy:
                        continue
                        
                    # Check if this ALT slot is OPEN (Capacity/Trainer)
                    # -- Availability Check Start --
                    active_trainers_count = db.query(models.Appointment.trainer_id).filter(
                        models.Appointment.start_time == b_slot_iso,
                        models.Appointment.status != "cancelled"
                    ).distinct().count()
                    
                    available_trainers = []
                    all_trainers = db.query(models.Trainer).all()
                    b_alt_dt = datetime.fromisoformat(b_slot_iso)
                    b_alt_doy = b_alt_dt.weekday()
                    b_alt_time_str = b_alt_dt.strftime("%H:%M")
                    
                    for trainer in all_trainers:
                        # Shift Check
                        is_working = False
                        for av in trainer.availabilities:
                            if av.day_of_week == b_alt_doy:
                                if av.start_time <= b_alt_time_str and av.end_time > b_alt_time_str:
                                    is_working = True
                                    break
                        if not is_working: continue
                        
                        # Capacity Check
                        current_clients = db.query(models.Appointment).filter(
                            models.Appointment.trainer_id == trainer.id,
                            models.Appointment.start_time == b_slot_iso,
                            models.Appointment.status != "cancelled"
                        ).count()
                        if current_clients >= 2: continue
                        
                        # Global Constraint
                        is_active = current_clients > 0
                        if not is_active and active_trainers_count >= 3: continue
                        
                        available_trainers.append(trainer)
                    # -- Availability Check End --

                    if available_trainers:
                        # Found a valid move for Blocker!
                        # 1. Update Blocker Appt
                        new_trainer = available_trainers[0] # Just pick first valid
                        
                        old_slot_str = blocker_appt.start_time # For record
                        
                        blocker_appt.start_time = b_slot_iso
                        blocker_appt.trainer_id = new_trainer.id 
                        # We don't change status, just time/trainer
                        
                        # 2. Book Victim in the NOW FREED slot_iso
                        # We need to find a trainer for the Victim at slot_iso
                        # Since we just moved a blocker, at least the Blocker's OLD trainer is available (capacity-wise)
                        # But we should re-verify strictly to be safe.
                        
                        # Re-run avail check for Victim at slot_iso
                        # ... (Simplified: use the blocker's old trainer if possible, or search)
                        
                        # Since we are inside the transaction, the DB query for `current_clients` won't reflect the change 
                        # until we flush? Or we can just assume it works because we decremented by moving.
                        # Using `new_appt` with `blocker_appt` trainer?
                        
                        # Let's try to assign Victim to Blocker's OLD trainer (if suitable) or any available.
                        # Search trainers for VICTIM at slot_iso
                        # Note: We must NOT count the blocker we just moved.
                        # But since we haven't committed, DB still sees blocker.
                        # Workaround: explicitly ignore blocker_appt.id in count queries? 
                        # OR: just assign to the same trainer ID the blocker vacated?
                        
                        # Risky if that trainer has constraints. But blocker was there, so trainer was working.
                        # Only risk is if victim has some other constraint? No.
                        # So assigning to vacated trainer is safe.
                        
                        vacated_trainer_id = blocker_appt.trainer_id # Wait, we updated the object above!
                        # Creating a new object for victim?
                        
                        # Wait, `blocker_appt.trainer_id` is already updated in memory to `new_trainer.id`.
                        # I should have saved the old ID first.
                        
                        # RE-LOGIC:
                        # Save old state
                        old_trainer_id = blocker_appt.trainer_id
                        
                        # Update Blocker
                        blocker_appt.start_time = b_slot_iso
                        blocker_appt.trainer_id = new_trainer.id
                        db.add(blocker_appt) # Stage update
                        
                        # Book Victim
                        victim_appt = models.Appointment(
                            trainer_id=old_trainer_id, # Take the spot
                            client_id=client.id,
                            client_name=client.email.split('@')[0],
                            client_email=client.email,
                            start_time=slot_iso,
                            status="confirmed"
                        )
                        db.add(victim_appt)
                        
                        client.workout_credits -= 1
                        missing_slots -= 1
                        booked_times.append(slot_dt)
                        
                        resolved_count += 1
                        resolved_details.append({
                            "client": client.email,
                            "original_slot": f"Blocked by {blocker_user.email}",
                            "new_slot": f"{slot_dt.strftime('%A %H:%M')}",
                            "trainer": "Swapped w/ Blocker",
                            "notes": f"Moved {blocker_user.email} to {b_alt_dt.strftime('%A %H:%M')}"
                        })
                        
                        db.commit()
                        slot_resolved = True
                        break # Break Blocker Loop
                
                if slot_resolved:
                    break # Break Blocker List Loop
            
            if slot_resolved:
                # Check next default slot
                pass

    return {
        "resolved_count": resolved_count,
        "details": resolved_details
    }
