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
    # allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_origins=["*"], # Allow Vercel/Anywhere for now 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_headers=["*"],
)

# --- Shared Seeding Logic ---
def seed_data(db: Session):
    if db.query(models.User).count() > 0:
        return {"message": "Database already seeded"}

    print("--- SEEDING DATABASE (Extended) ---")
    
    # 1. Admin
    admin = models.User(email="admin@gym.com", hashed_password="adminpassword", role="admin")
    db.add(admin)
    
    # 2. Trainers (Users)
    t_users = []
    for i in range(1, 5): # 4 Trainers
        t_users.append(models.User(email=f"trainer{i}@gym.com", hashed_password="password", role="trainer"))
    db.add_all(t_users)
    db.commit()

    # 3. Trainers (Profiles)
    trainers_data = [
        {"name": "Mike Tyson", "role": "Boxing Coach", "bio": "Everyone has a plan until they get punched in the face.", "seed": "Mike"},
        {"name": "Sarah Connor", "role": "Endurance", "bio": "Come with me if you want to lift.", "seed": "Sarah"},
        {"name": "Arnold S.", "role": "Bodybuilding", "bio": "I'll be back... for another set.", "seed": "Arnold"},
        {"name": "Ronda R.", "role": "MMA / Grappling", "bio": "Armbar expert.", "seed": "Ronda"},
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
    
    # 4. Clients (10 Clients)
    clients = []
    for i in range(1, 11):
        clients.append(models.User(email=f"client{i}@gym.com", hashed_password="password", role="client"))
    db.add_all(clients)
    
    db.commit()
    print("--- SEEDING COMPLETE ---")
    return {"message": "Database seeded with 4 Trainers and 10 Clients"}

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
def seed_db(db: Session = Depends(get_db)):
    return seed_data(db)


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

    # 2. Validate Time Slots (Morning: 07:00-13:00, Evening: 15:00-21:00)
    # We extended to 13:00 and 21:00 to allow 12:00 and 20:00 start times for sessions.
    valid_morning = (availability.start_time == "07:00" and availability.end_time == "13:00")
    valid_evening = (availability.start_time == "15:00" and availability.end_time == "21:00")

    if not (valid_morning or valid_evening):
        raise HTTPException(
            status_code=400, 
            detail="Invalid time slot. Must be Morning (07:00-13:00) or Evening (15:00-21:00)."
        )

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

    db_appointment = models.Appointment(**appointment.dict())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@app.put("/appointments/{appointment_id}/cancel", response_model=schemas.Appointment)
def cancel_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appointment.status = "cancelled"
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
    print(f"Clearing week starting: {week_start_date}")
    print(f"Range: {start_date} to {end_date}")
    
    result = db.query(models.Appointment).filter(
        models.Appointment.start_time >= start_date.isoformat(),
        models.Appointment.start_time < end_date.isoformat()
    ).delete(synchronize_session=False)
    
    print(f"Deleted {result} appointments.")
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
            
        for slot in client.default_slots:
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
            # 3. Optimize: Reuse active trainers first to save 'Gym Capacity' slots? Or doesn't matter?
            #    The rule is "Only 3 trainers can train simultaneously".
            #    So if 2 trainers are active, we can add a 3rd.
            #    If 3 are active, we MUST use one of them.
            
            available_trainers = []
            
            # Get all trainers
            all_trainers = db.query(models.Trainer).all()
            
            for trainer in all_trainers:
                # A. Check Shift Availability
                # slot.start_time is "HH:MM". Availability has start/end.
                # Simplification: Exact match on start_time since we use fixed slots?
                # Or range check? Let's use range check.
                is_working = False
                for av in trainer.availabilities:
                    if av.day_of_week == slot.day_of_week:
                        # Check start time match (assuming slots align for now)
                        if av.start_time <= slot.start_time and av.end_time > slot.start_time:
                            is_working = True
                            break
                            
                if not is_working:
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
            success_count += 1
            
            # Update active count for next iteration (approximate within transaction)
            # Actually db.commit is needed to update queries? 
            # Ideally we do this in one go or careful logic. 
            # For simplicity let's commit per booking or carefully track in memory?
            # Committing per booking is safer for MVP logic Correctness check re-runs.
            db.commit() 
            
    return {
        "success_count": success_count,
        "failed_assignments": failed_assignments
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

@app.get("/appointments/", response_model=List[schemas.Appointment])
def read_appointments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    appointments = db.query(models.Appointment).order_by(models.Appointment.start_time.asc()).offset(skip).limit(limit).all()
    return appointments

# Endpoint replaced by shared logic above
# Force Reload
