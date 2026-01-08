import requests
import datetime

BASE_URL = "http://localhost:8000"

def test_ranges():
    # 1. Get Setup
    trainers = requests.get(f"{BASE_URL}/trainers/").json()
    if not trainers: return
    trainer_id = trainers[0]['id']
    
    users = requests.get(f"{BASE_URL}/users/").json()
    client = next((u for u in users if u['role'] == 'client'), None)
    if not client: return
    
    print(f"Client: {client['email']}")
    
    today = datetime.date.today()
    next_monday = today + datetime.timedelta(days=(7 - today.weekday()))
    
    base_payload = {
        "trainer_id": trainer_id,
        "client_name": "Test",
        "client_email": client['email'],
        "client_id": client['id']
    }

    test_cases = [
        (7, True),   # Morning Start
        (10, True),  # Morning Mid
        (12, True),  # Morning End
        (13, False), # Gap (Lunch?)
        (15, True),  # Evening Start
        (20, True),  # Evening End
        (21, False)  # Too late
    ]

    for hour, should_pass in test_cases:
        time_str = f"{next_monday}T{hour:02d}:00:00"
        payload = base_payload.copy()
        payload["start_time"] = time_str
        
        print(f"Testing {time_str} (Expect {'PASS' if should_pass else 'FAIL'})...")
        r = requests.post(f"{BASE_URL}/appointments/", json=payload)
        
        success = False
        if r.status_code == 200:
            success = True
            requests.put(f"{BASE_URL}/appointments/{r.json()['id']}/cancel")
        elif "already have a booking" in r.text:
             success = True # Logically pass for restriction test
        
        if success == should_pass:
            print("✅ OK")
        else:
            print(f"❌ FAIL: Status {r.status_code} {r.text}")

if __name__ == "__main__":
    test_ranges()
