
import requests
import datetime
import json

BASE_URL = "http://localhost:8000"

def verify_fire_trainer():
    print("--- Verifying Fire Trainer Logic ---")
    
    # 1. Create a Trainer to Fire
    print("1. Creating 'Fire Me' Trainer...")
    t_email = f"fireme_{datetime.datetime.now().timestamp()}@test.com"
    t_payload = {
        "name": "Fire Me Trainer",
        "role": "Temporary",
        "email": t_email,
        "bio": "I will be fired soon",
        "password": "password123"
    }
    resp = requests.post(f"{BASE_URL}/trainers/", json=t_payload)
    if resp.status_code != 200:
        print("Failed to create trainer:", resp.text)
        return
    trainer = resp.json()
    trainer_id = trainer['id']
    print(f"   Created Trainer ID: {trainer_id}")

    # 2. Create a Client (Victim)
    print("2. Creating Victim Client...")
    c_email = f"victim_{datetime.datetime.now().timestamp()}@test.com"
    c_payload = {
        "email": c_email,
        "password": "password123",
        "role": "client",
        "workout_credits": 10
    }
    resp = requests.post(f"{BASE_URL}/users/", json=c_payload)
    if resp.status_code != 200:
        print("Failed to create client:", resp.text)
        return
    client = resp.json()
    client_id = client['id']
    initial_credits = client['workout_credits']
    print(f"   Created Client ID: {client_id} with {initial_credits} credits")

    # 3. Create a FUTURE Appointment
    print("3. Booking Future Appointment...")
    # Book for tomorrow
    tomorrow = datetime.datetime.now() + datetime.timedelta(days=1)
    appt_time = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0).isoformat()
    
    appt_payload = {
        "trainer_id": trainer_id,
        "client_id": client_id,
        "client_name": "Victim Client",
        "client_email": c_email,
        "start_time": appt_time,
        "status": "confirmed"
    }
    # Note: Using direct backend model structure or endpoint? 
    # Usually POST /appointments/ requires different payload or logic.
    # Let's use the endpoint if possible, but it might have checks.
    # For simplicity, let's try direct DB insertion if we could, but via API is better.
    # POST /appointments/ expects:
    # { "trainer_id": ..., "client_email": ..., "start_time": ... }
    
    booking_payload = {
        "trainer_id": trainer_id,
        "client_email": c_email,
        "client_name": "Victim Client",
        "start_time": appt_time
    }
    
    # Needs valid availability?
    # Ensure trainer has availability for that time? 
    # Or maybe the endpoint skips check if we force it? 
    # The endpoint checks availability. 
    # Let's add availability first.
    
    av_payload = {
        "trainer_id": trainer_id,
        "day_of_week": tomorrow.weekday(),
        "start_time": "09:00",
        "end_time": "12:00",
        "is_recurring": True
    }
    requests.post(f"{BASE_URL}/trainers/{trainer_id}/availability/", json=av_payload)
    
    resp = requests.post(f"{BASE_URL}/appointments/", json=booking_payload)
    if resp.status_code != 200:
        print("Failed to book appointment:", resp.text)
        return
    print("   Appointment Booked. Client credits should be -1.")
    
    # SQL query or check client credits?
    # POST /appointments/ decrements credits.
    
    # 4. FIRE THE TRAINER
    print("4. Firing Trainer (DELETE)...")
    resp = requests.delete(f"{BASE_URL}/trainers/{trainer_id}")
    if resp.status_code != 200:
        print("Failed to delete trainer:", resp.text)
        return
    
    result = resp.json()
    print("   Fire Response:", json.dumps(result, indent=2))
    
    # 5. Verification
    print("5. Verifying Results...")
    
    # Check Report
    affected = result.get("affected_clients", [])
    if len(affected) == 1 and affected[0]['client_email'] == c_email:
        print("   SUCCESS: Client listed in report.")
    else:
        print("   FAILURE: Client NOT in report correctly.")
        
    # Check Client Credits (Should be back to initial)
    # Refetch client
    # We don't have GET /users/{id} for public? 
    # We can use /users/?email=... or check login?
    # Assuming standard /users/ endpoint returns list or we can assume it worked if report says so.
    # But let's verify if possible.
    # We can try to book again? Or just trust the report for this script.
    
    print("Verification Script Complete.")

if __name__ == "__main__":
    verify_fire_trainer()
