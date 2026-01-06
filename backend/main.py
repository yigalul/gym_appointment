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
    db_availability = models.Availability(**availability.dict(), trainer_id=trainer_id)
    db.add(db_availability)
    db.commit()
    db.refresh(db_availability)
    return db_availability

# --- Appointment Endpoints ---

@app.post("/appointments/", response_model=schemas.Appointment)
def create_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    # 1. Custom Restriction: Max 3 total appointments in the gym at this time
    global_count = db.query(models.Appointment).filter(
        models.Appointment.start_time == appointment.start_time,
        models.Appointment.status != "cancelled"
    ).count()
    
    if global_count >= 3:
         raise HTTPException(status_code=400, detail="Gym capacity reached for this time slot (Max 3 sessions).")

    # 2. Custom Restriction: Max 2 appointments per trainer per slot
    trainer_count = db.query(models.Appointment).filter(
        models.Appointment.trainer_id == appointment.trainer_id,
        models.Appointment.start_time == appointment.start_time,
         models.Appointment.status != "cancelled"
    ).count()

    if trainer_count >= 2:
        raise HTTPException(status_code=400, detail="Trainer is fully booked for this time slot (Max 2 clients).")

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
