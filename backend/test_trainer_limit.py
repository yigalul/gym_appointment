import requests
from database import SessionLocal
from models import User, Trainer, Availability, Appointment

# API Base URL
API_URL = "http://127.0.0.1:8000"

def seed_trainers_limit_test():
    db = SessionLocal()
    try:
        print("Cleaning up database...")
        db.query(Appointment).delete()
        db.query(Availability).delete()
        db.query(Trainer).delete()
        db.query(User).delete()
        db.commit()

        print("Creating 4 Trainers...")
        trainers = []
        for i in range(4):
            # Create User
            email = f"limit_trainer_{i+1}@gym.com"
            user_payload = {"email": email, "password": "password123", "role": "trainer"}
            # We use direct DB for User/Trainer creation to speed up setup, 
            # but we MUST use API for Availability to test the validation.
            # Actually, let's use API for everything to be cleaner if possible, 
            # or DB for setup and API for the *test step*.
            
            # DB for Setup
            u = User(email=email, hashed_password="hashed", role="trainer")
            db.add(u)
            db.commit()
            db.refresh(u)
            
            t = Trainer(user_id=u.id, name=f"Trainer {i+1}", role="Coach", bio="", photo_url="")
            db.add(t)
            db.commit()
            db.refresh(t)
            trainers.append({"id": t.id, "name": t.name})
            
        return trainers
    finally:
        db.close()

def test_enforcement(trainers):
    print("\nTesting 3-Trainer Limit...")
    
    # Try to assign ALL 4 trainers to Monday Morning (09:00 - 12:00)
    # Note: Our validation checks overlapping. Slots are 07:00-12:00 (Morning).
    # We'll use standard "07:00" start for 'Morning' shift availability.
    
    availability_payload = {
        "day_of_week": 0, # Monday
        "start_time": "07:00",
        "end_time": "12:00",
        "is_recurring": True
    }

    # 1. Trainer 1 -> Expect Success
    print("Assigning Trainer 1... ", end="")
    res = requests.post(f"{API_URL}/trainers/{trainers[0]['id']}/availability/", json=availability_payload)
    if res.status_code == 200:
        print("SUCCESS")
    else:
        print(f"FAILED: {res.text}")

    # 2. Trainer 2 -> Expect Success
    print("Assigning Trainer 2... ", end="")
    res = requests.post(f"{API_URL}/trainers/{trainers[1]['id']}/availability/", json=availability_payload)
    if res.status_code == 200:
        print("SUCCESS")
    else:
        print(f"FAILED: {res.text}")

    # 3. Trainer 3 -> Expect Success
    print("Assigning Trainer 3... ", end="")
    res = requests.post(f"{API_URL}/trainers/{trainers[2]['id']}/availability/", json=availability_payload)
    if res.status_code == 200:
        print("SUCCESS")
    else:
        print(f"FAILED: {res.text}")

    # 4. Trainer 4 -> Expect FAILURE (400)
    print("Assigning Trainer 4... ", end="")
    res = requests.post(f"{API_URL}/trainers/{trainers[3]['id']}/availability/", json=availability_payload)
    if res.status_code == 400 and "Shift is full" in res.text:
        print("SUCCESS (Blocked as expected)")
    else:
        print(f"FAILED (Should have been blocked): {res.status_code} {res.text}")

    # 5. Trainer 4 -> Different Shift (Evening) -> Expect Success
    print("Assigning Trainer 4 to Evening... ", end="")
    evening_payload = {
        "day_of_week": 0,
        "start_time": "15:00",
        "end_time": "20:00",
        "is_recurring": True
    }
    res = requests.post(f"{API_URL}/trainers/{trainers[3]['id']}/availability/", json=evening_payload)
    if res.status_code == 200:
        print("SUCCESS")
    else:
        print(f"FAILED: {res.text}")

if __name__ == "__main__":
    trainers = seed_trainers_limit_test()
    test_enforcement(trainers)
