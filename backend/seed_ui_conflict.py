
import requests
import datetime
from datetime import timedelta

BASE_URL = "http://localhost:8000"

def setup_fresh_week():
    print("\n--- Setting up Fresh Week for UI Test ---")
    today = datetime.date.today()
    # Ensure we use next Monday to avoid past date issues in UI?
    # Or just use current week if today is Sunday? 
    # Let's use the date the previous script used: 2026-01-19 (if that was next mon)
    # Actually, dynamic is better.
    next_monday = today + timedelta(days=(7 - today.weekday()))
    requests.post(f"{BASE_URL}/settings/current-week", json={"date": next_monday.isoformat()})
    requests.delete(f"{BASE_URL}/appointments/week/{next_monday.isoformat()}")
    return next_monday

def ensure_user(email, role="client", first_name="Test", default_slots=[]):
    payload = {
        "email": email, "password": "password", "role": role,
        "first_name": first_name, "last_name": "User",
        "default_slots": default_slots,
        "weekly_workout_limit": len(default_slots) if role == "client" else 0
    }
    # Try create or update
    users = requests.get(f"{BASE_URL}/users/").json()
    user = next((u for u in users if u['email'] == email), None)
    
    if not user:
        requests.post(f"{BASE_URL}/users/", json=payload)
        user = next(u for u in requests.get(f"{BASE_URL}/users/").json() if u['email'] == email)
    else:
        # Update defaults and limit
        requests.put(f"{BASE_URL}/users/{user['id']}", json={
            "default_slots": default_slots,
            "weekly_workout_limit": len(default_slots) if role == "client" else 0
        })
    
    # Add credits
    if role == "client":
        requests.put(f"{BASE_URL}/users/{user['id']}", json={"workout_credits": 10})
    return user

def ensure_trainer(email, name):
    u = ensure_user(email, role="trainer", first_name=name)
    trainers = requests.get(f"{BASE_URL}/trainers/").json()
    t_profile = next((t for t in trainers if t['user_id'] == u['id']), None)
    
    if not t_profile:
        print(f"Creating trainer profile for {email}...")
        res = requests.post(f"{BASE_URL}/trainers/", json={
            "user_id": u['id'], "name": name, "role": "Coach", "bio": ".", "photo_url": "http://img.com"
        })
        if res.status_code == 200:
            t_profile = res.json()
        else:
            print(f"Error creating trainer: {res.text}")
            return None
    return t_profile

def run_seed():
    week_start = setup_fresh_week()
    mon_iso = week_start.isoformat()
    
    # 1. Setup Trainer
    t1 = ensure_trainer("shifter_ui@test.com", "ShifterUI")
    t1_id = t1['id']
    # Avail: Mon 07-13 and 15-21
    requests.post(f"{BASE_URL}/trainers/{t1_id}/availability/", json={"day_of_week":0, "start_time":"07:00", "end_time":"13:00"})
    requests.post(f"{BASE_URL}/trainers/{t1_id}/availability/", json={"day_of_week":0, "start_time":"15:00", "end_time":"21:00"})
    
    # 2. Setup Clients (Capacity 2)
    # Two Blockers at Mon 9am
    ensure_user("blocker_ui_1@test.com", default_slots=[{"day_of_week":0, "start_time":"09:00"}])
    ensure_user("blocker_ui_2@test.com", first_name="FlexibleBlocker", default_slots=[
        {"day_of_week":0, "start_time":"09:00"},
        {"day_of_week":0, "start_time":"17:00"}
    ])
    
    # Victim at Mon 9am
    ensure_user("victim_ui@test.com", first_name="VictimUI", default_slots=[{"day_of_week":0, "start_time":"09:00"}])
    
    print("--- Running Initial Auto-Schedule (Should Fail for Victim) ---")
    requests.post(f"{BASE_URL}/appointments/auto-schedule", json={"week_start_date": mon_iso})
    
    print(f"Done. State prepared for UI Test on Monday {mon_iso}")

if __name__ == "__main__":
    run_seed()
