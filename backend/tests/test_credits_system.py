import requests
import json
import random

BASE_URL = "http://localhost:8000"

def test_workout_credits():
    print("--- Testing Workout Credits System ---")

    # 1. Create a User
    email = f"test_credit_{random.randint(1000,9999)}@example.com"
    password = "password123"
    
    user_payload = {
        "email": email,
        "password": password,
        "role": "client",
        "first_name": "Credit",
        "last_name": "Tester",
        "default_slots": []
    }
    
    r = requests.post(f"{BASE_URL}/users/", json=user_payload)
    if r.status_code != 200:
        print(f"Failed to create user: {r.text}")
        return
    
    user = r.json()
    user_id = user['id']
    print(f"Created User ID: {user_id}, Credits: {user.get('workout_credits')}")

    # 2. Set Credits to 1 via Admin Update (Simulated)
    # Actually we can just update the user if we assume admin rights or just rely on default 10.
    # Let's rely on default 10 first, then update to 1 for stricter testing.
    
    # Update to 1 credit
    update_payload = {
        "workout_credits": 1
    }
    r = requests.put(f"{BASE_URL}/users/{user_id}", json=update_payload)
    if r.status_code != 200:
        print(f"Failed to update credits: {r.text}")
        return
    
    print("Updated credits to 1.")

    # 3. Create a Trainer and Slot (so we can book)
    trainer_email = f"trainer_{random.randint(1000,9999)}@gym.com"
    # Create trainer user first
    r = requests.post(f"{BASE_URL}/users/", json={"email": trainer_email, "password": "pw", "role": "trainer"})
    tr_user = r.json()
    
    trainer_payload = {
        "name": "Test Trainer",
        "role": "Coach",
        "user_id": tr_user['id']
    }
    r = requests.post(f"{BASE_URL}/trainers/", json=trainer_payload)
    trainer = r.json()
    trainer_id = trainer['id']
    
    # Add availability
    avail_payload = {
        "day_of_week": 1, # Monday
        "start_time": "15:00",
        "end_time": "16:00"
    }
    requests.post(f"{BASE_URL}/trainers/{trainer_id}/availability/", json=avail_payload)
    
    # 4. Book Appointment (Should Succeed)
    # Calculate a valid date (next Monday)
    from datetime import datetime, timedelta
    today = datetime.now()
    days_ahead = 0 - today.weekday() + 7 # Next Monday
    if days_ahead <= 0: days_ahead += 7
    next_monday = today + timedelta(days=days_ahead)
    start_time = f"{next_monday.strftime('%Y-%m-%d')}T15:00:00"

    appt_payload = {
        "trainer_id": trainer_id,
        "client_name": "Credit Tester",
        "client_email": email,
        "start_time": start_time
    }
    
    r = requests.post(f"{BASE_URL}/appointments/", json=appt_payload)
    if r.status_code == 200:
        print("Booking 1 Successful.")
    else:
        print(f"Booking 1 Failed: {r.text}")
        return

    # 5. Check Credits (Should be 0)
    r = requests.get(f"{BASE_URL}/users/{user_id}")
    u = r.json()
    print(f"Credits after booking: {u.get('workout_credits')}")
    if u.get('workout_credits') != 0:
        print("ERROR: Credits did not decrement!")
    else:
        print("PASS: Credits decremented to 0.")

    # 6. Book Second Appointment (Should Fail)
    # Same trainer, different time? Or same time different trainer? 
    # Just try booking.
    # Note: Logic prevents duplicate booking for SAME slot.
    # We need another slot or just assume the credit check happens BEFORE duplicate check?
    # No, usually logical checks. Let's try booking another time.
    
    # Add another slot for trainer
    avail_payload_2 = {
        "day_of_week": 1, 
        "start_time": "16:00",
        "end_time": "17:00"
    }
    requests.post(f"{BASE_URL}/trainers/{trainer_id}/availability/", json=avail_payload_2)
    
    start_time_2 = f"{next_monday.strftime('%Y-%m-%d')}T16:00:00"
    appt_payload['start_time'] = start_time_2
    
    r = requests.post(f"{BASE_URL}/appointments/", json=appt_payload)
    if r.status_code == 400 and "0 workout credits" in r.text:
         print("PASS: Booking blocked due to 0 credits.")
    else:
        print(f"ERROR: Expected failure, got {r.status_code} {r.text}")

    # 7. Cancel Appointment (Refund)
    # Get appt id from step 4
    # Wait, I didn't save it. Re-fetching bookings.
    r = requests.get(f"{BASE_URL}/appointments/")
    all_appts = r.json()
    my_appt = [a for a in all_appts if a['client_email'] == email][0]
    
    r = requests.put(f"{BASE_URL}/appointments/{my_appt['id']}/cancel")
    print("Cancelled appointment.")
    
    # 8. Check Credits (Should be 1)
    r = requests.get(f"{BASE_URL}/users/{user_id}")
    u = r.json()
    print(f"Credits after cancellation: {u.get('workout_credits')}")
    if u.get('workout_credits') == 1:
        print("PASS: Credits refunded.")
    else:
        print("ERROR: Credits not refunded.")

if __name__ == "__main__":
    test_workout_credits()
