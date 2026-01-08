import requests
import datetime

BASE_URL = "http://localhost:8000"

def run_step(name, fn):
    print(f"\n--- {name} ---")
    try:
        fn()
        print("✅ Success")
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False
    return True

def check_health():
    # Trainers
    r = requests.get(f"{BASE_URL}/trainers/")
    if r.status_code != 200:
        raise Exception(f"Trainers endpoint failed: {r.status_code} {r.text}")
    print(f"Trainers: {len(r.json())} found")

    # Users
    r = requests.get(f"{BASE_URL}/users/")
    if r.status_code != 200:
        raise Exception(f"Users endpoint failed: {r.status_code}")
    print(f"Users: {len(r.json())} found")

def test_auto_schedule():
    # Use next week to avoid conflicts
    week_start = "2026-02-02" 
    payload = {"week_start_date": week_start}
    
    print(f"Auto-scheduling for {week_start}...")
    r = requests.post(f"{BASE_URL}/appointments/auto-schedule", json=payload)
    if r.status_code != 200:
        raise Exception(f"Auto-schedule failed: {r.status_code} {r.text}")
    
    data = r.json()
    print(f"Report: {data}")
    
    # Verify appointments
    r = requests.get(f"{BASE_URL}/appointments/")
    appts = [a for a in r.json() if a['start_time'].startswith(week_start)]
    print(f"Appointments for week: {len(appts)}")
    if len(appts) == 0 and data['success_count'] > 0:
         raise Exception("Mismatch: Report says success but no appointments found!")

def test_clear_week():
    week_start = "2026-02-02"
    print(f"Clearing week {week_start}...")
    
    r = requests.delete(f"{BASE_URL}/appointments/week/{week_start}")
    if r.status_code != 200:
        raise Exception(f"Clear week failed: {r.status_code} {r.text}")
    print(f"Response: {r.json()}")

    # Verify gone
    r = requests.get(f"{BASE_URL}/appointments/")
    appts = [a for a in r.json() if a['start_time'].startswith(week_start)]
    print(f"Appointments remaining: {len(appts)}")
    if len(appts) > 0:
        raise Exception("Clear week failed to remove appointments!")

if __name__ == "__main__":
    try:
        if run_step("Health Check", check_health):
            run_step("Test Auto-Schedule", test_auto_schedule)
            run_step("Test Clear Week", test_clear_week)
    except Exception as e:
        print(f"Script Error: {e}")
