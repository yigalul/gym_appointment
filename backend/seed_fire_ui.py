
import requests
import datetime

BASE_URL = "http://localhost:8000"

def seed_fire_ui():
    print("--- Seeding Fire Trainer UI Test ---")
    
    # 1. Create Trainer
    t_email = f"fire_ui_{datetime.datetime.now().timestamp()}@test.com"
    t_payload = {
        "name": "Fire Me UI Trainer",
        "role": "Temporary",
        "email": t_email,
        "bio": "I am here to be fired via UI",
        "password": "password123"
    }
    resp = requests.post(f"{BASE_URL}/trainers/", json=t_payload)
    if resp.status_code != 200:
        print("Failed to create trainer:", resp.text)
        return
    trainer = resp.json()
    trainer_id = trainer['id']
    print(f"Created Trainer: {t_email} (ID: {trainer_id})")

    # 2. Availability
    tomorrow = datetime.datetime.now() + datetime.timedelta(days=1)
    av_payload = {
        "trainer_id": trainer_id,
        "day_of_week": tomorrow.weekday(),
        "start_time": "09:00",
        "end_time": "12:00",
        "is_recurring": True
    }
    requests.post(f"{BASE_URL}/trainers/{trainer_id}/availability/", json=av_payload)


    # 3. Create Client
    c_email = f"victim_ui_{datetime.datetime.now().timestamp()}@test.com"
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
    
    # 4. Book Appointment
    appt_time = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0).isoformat()
    booking_payload = {
        "trainer_id": trainer_id,
        "client_email": c_email,
        "client_name": "Victim UI",
        "start_time": appt_time
    }
    resp = requests.post(f"{BASE_URL}/appointments/", json=booking_payload)
    if resp.status_code == 200:
        print(f"Booked Appointment for {c_email} with Trainer ID {trainer_id}")
    else:
        print("Failed to book appointment:", resp.text)

    print("--- Seeding Complete ---")
    print(f"Go to Admin Dashboard > Trainers.")
    print(f"Find 'Fire Me UI Trainer' and delete them.")
    print(f"Expect to see the Impact Report Modal.")

if __name__ == "__main__":
    seed_fire_ui()
