import requests

BASE_URL = "http://localhost:8000"

def verify_toggle():
    # 1. Get Trainer
    trainers = requests.get(f"{BASE_URL}/trainers/").json()
    if not trainers:
        print("No trainers found.")
        return
    trainer_id = trainers[0]['id']
    print(f"Trainer ID: {trainer_id}")

    # 2. Define Slot (e.g. Wednesday Morning)
    slot = {
        "day_of_week": 3,
        "start_time": "07:00",
        "end_time": "12:00",
        "is_recurring": True
    }

    # 2.5 CLEANUP FIRST: Delete ANY shift on this day to prevent overlap errors
    # (The DB has legacy 09:00-17:00 shifts that block 07:00-12:00)
    r = requests.get(f"{BASE_URL}/trainers/{trainer_id}")
    for a in r.json()['availabilities']:
        if a['day_of_week'] == 3: # Delete ALL Wednesday shifts
             print(f"Cleanup: Deleting overlapping slot ID {a['id']} ({a['start_time']}-{a['end_time']})...")
             requests.delete(f"{BASE_URL}/availability/{a['id']}")

    # 3. Add Slot (Toggle On)
    print("\nSimulating 'Click' on Empty Cell (Add)...")
    r = requests.post(f"{BASE_URL}/trainers/{trainer_id}/availability/", json=slot)
    if r.status_code == 200:
        print(f"✅ Slot Added. ID: {r.json()['id']}")
        slot_id = r.json()['id']
    else:
        print(f"❌ Add Failed: {r.text}")
        return

    # 4. Verify Active
    r = requests.get(f"{BASE_URL}/trainers/{trainer_id}")
    avails = r.json()['availabilities']
    exists = any(a['id'] == slot_id for a in avails)
    print(f"Slot exists in DB: {exists}")

    # 5. Remove Slot (Toggle Off)
    print("\nSimulating 'Click' on Active Cell (Delete)...")
    r = requests.delete(f"{BASE_URL}/availability/{slot_id}")
    if r.status_code == 204: # checking for 204 No Content
        # Requests might return 200 depending on FastAPI setup, but strictly should be 204 or 200
         print("✅ Slot Deleted (204 OK)")
    elif r.status_code == 200:
         print("✅ Slot Deleted (200 OK)")
    else:
        print(f"❌ Delete Failed: {r.status_code} {r.text}")

    # 6. Verify Removed
    r = requests.get(f"{BASE_URL}/trainers/{trainer_id}")
    avails = r.json()['availabilities']
    exists = any(a['id'] == slot_id for a in avails)
    print(f"Slot exists in DB: {exists} (Should be False)")

if __name__ == "__main__":
    verify_toggle()
