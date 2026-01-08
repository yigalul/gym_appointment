import requests

BASE_URL = "http://localhost:8000"

def test_duplicate_availability():
    # 1. Get first trainer
    trainers = requests.get(f"{BASE_URL}/trainers/").json()
    if not trainers:
        print("No trainers found.")
        return
    
    trainer_id = trainers[0]['id']
    print(f"Testing with Trainer {trainer_id}")

    # 2. Define a valid slot (e.g., Monday Morning)
    # Using Monday (1) 07:00-12:00
    slot = {
        "day_of_week": 1,
        "start_time": "07:00",
        "end_time": "12:00",
        "is_recurring": True
    }

    # 3. Create FIRST time
    print("\nAttempting 1st creation...")
    r1 = requests.post(f"{BASE_URL}/trainers/{trainer_id}/availability/", json=slot)
    
    if r1.status_code == 200:
        print("✅ 1st creation successful (Expected)")
    else:
        print(f"⚠️ 1st creation failed: {r1.status_code} {r1.text}")
        # If it failed, maybe it already exists?
        # Proceed to try again to see if it allows duplicates regardless.

    # 4. Create SECOND time (Exact Duplicate)
    print("\nAttempting 2nd creation (Duplicate)...")
    r2 = requests.post(f"{BASE_URL}/trainers/{trainer_id}/availability/", json=slot)
    
    if r2.status_code == 200:
        print("❌ 2nd creation successful! (BUG DETECTED: Duplicate allowed)")
    elif r2.status_code == 400:
        print("✅ 2nd creation failed (Expected behavior if fixed)")
        print(f"Response: {r2.text}")
    else:
        print(f"❓ Unexpected status: {r2.status_code} {r2.text}")

if __name__ == "__main__":
    test_duplicate_availability()
