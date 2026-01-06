from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- User Endpoints ---

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(email=user.email, hashed_password=user.password, role=user.role)
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
    
    if user_update.weekly_workout_limit is not None:
        db_user.weekly_workout_limit = user_update.weekly_workout_limit
    
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

@app.post("/trainers/{trainer_id}/availability/", response_model=schemas.Availability)
def create_availability(trainer_id: int, availability: schemas.AvailabilityBase, db: Session = Depends(get_db)):
    # 1. Validate Day (Sunday=0 to Friday=5, Saturday=6 is not allowed)
    if availability.day_of_week == 6:
        raise HTTPException(status_code=400, detail="Trainers cannot schedule on Saturdays.")

    # 2. Validate Time Slots (Morning: 07:00-12:00, Evening: 15:00-20:00)
    valid_morning = (availability.start_time == "07:00" and availability.end_time == "12:00")
    valid_evening = (availability.start_time == "15:00" and availability.end_time == "20:00")

    if not (valid_morning or valid_evening):
        raise HTTPException(
            status_code=400, 
            detail="Invalid time slot. Must be Morning (07:00-12:00) or Evening (15:00-20:00)."
        )

    db_availability = models.Availability(**availability.dict(), trainer_id=trainer_id)
    db.add(db_availability)
    db.commit()
    db.refresh(db_availability)
    return db_availability

# --- Appointment Endpoints ---

@app.post("/appointments/", response_model=schemas.Appointment)
def create_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    # 1. Gym Capacity: Max 6 appointments total per slot
    global_count = db.query(models.Appointment).filter(
        models.Appointment.start_time == appointment.start_time,
        models.Appointment.status != "cancelled"
    ).count()
    
    if global_count >= 6:
         raise HTTPException(status_code=400, detail="Gym capacity reached for this time slot (Max 6 clients).")

    # 2. Trainer Capacity: Max 3 unique trainers per slot AND Max 2 clients per trainer
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

    # 3. Duplicate Booking Check: User cannot book the same slot twice
    # (Checking by email which is our current unique identifier mostly)
    existing_appointment = db.query(models.Appointment).filter(
        models.Appointment.client_email == appointment.client_email,
        models.Appointment.start_time == appointment.start_time,
        models.Appointment.status != "cancelled"
    ).first()

    if existing_appointment:
        raise HTTPException(status_code=400, detail="You already have a booking at this time.")

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

    # Get user to check limit (assuming client_email is unique identifier for now, or use client_id if available)
    # Ideally should use client_id, but current schema uses user_id generally. 
    # Let's find user by email since we have it in payload
    client_user = db.query(models.User).filter(models.User.email == appointment.client_email).first()
    
    if not client_user:
        # Fallback or create? For now assume user exists if using the UI
        # Should probably strict fail in real app
        user_limit = 3 # Default fallback
    else:
        user_limit = client_user.weekly_workout_limit

    # Count user's appointments in this week
    weekly_count = db.query(models.Appointment).filter(
        models.Appointment.client_email == appointment.client_email,
        models.Appointment.status != "cancelled",
        models.Appointment.start_time >= start_of_week.isoformat(),
        models.Appointment.start_time < end_of_week.isoformat()
    ).count()

    if weekly_count >= user_limit:
        raise HTTPException(status_code=400, detail=f"Weekly workout limit reached ({user_limit} sessions/week).")

    db_appointment = models.Appointment(**appointment.dict())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@app.get("/appointments/", response_model=List[schemas.Appointment])
def read_appointments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    appointments = db.query(models.Appointment).order_by(models.Appointment.start_time.asc()).offset(skip).limit(limit).all()
    return appointments

@app.get("/test-seed")
def seed_db(db: Session = Depends(get_db)):
    if db.query(models.User).count() == 0:
        # 1. Admin
        admin = models.User(email="admin@gym.com", hashed_password="adminpassword", role="admin")
        db.add(admin)
        
        # 2. Client
        client = models.User(email="client@example.com", hashed_password="clientpassword", role="client")
        db.add(client)
        
        # 3. Trainer User
        trainer_user = models.User(email="sarah@gym.com", hashed_password="trainerpassword", role="trainer")
        db.add(trainer_user)
        db.commit()
        db.refresh(trainer_user)

        # 4. Trainer Profile
        trainer_profile = models.Trainer(
            user_id=trainer_user.id,
            name='Sarah Connor',
            role='Strength Coach',
            bio='Specializing in functional training.',
            photo_url='https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=200&h=200'
        )
        db.add(trainer_profile)
        db.commit()
        db.refresh(trainer_profile)

        # 5. Availability for Sarah
        a1 = models.Availability(trainer_id=trainer_profile.id, day_of_week=1, start_time="09:00", end_time="12:00")
        db.add(a1)
        
        # 6. Appointment (Client -> Sarah)
        app1 = models.Appointment(
            trainer_id=trainer_profile.id,
            client_id=client.id,
            client_name="Test Client",
            client_email=client.email,
            start_time="2023-11-01T10:00:00",
            status="confirmed"
        )
        db.add(app1)

        db.commit()
        return {"message": "Database seeded with Admin, Client, and Trainer"}
    
    return {"message": "Database already seeded"}
