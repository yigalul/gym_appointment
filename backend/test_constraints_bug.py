import requests

API_URL = "http://127.0.0.1:8000"

# Use specific users for testing
CLIENT_EMAIL = "alice@gym.com"
TRAINER_ID = 2 # Mike Mentzer, assuming he exists from previous steps
TIME_SLOT = "2026-06-03T09:00:00" # Wed 9am

def book(client_email, trainer_id, time_slot, expect_success=True):
    # Need to verify user's email exists first or just assume from seeds
    print(f"\nAttempting to book for {client_email} with Trainer {trainer_id} at {time_slot}...")
    response = requests.post(f"{API_URL}/appointments/", json={
        "trainer_id": trainer_id,
        "client_name": "Test Client",
        "client_email": client_email,
        "start_time": time_slot,
        "status": "confirmed"
    })
    
    if expect_success:
        if response.status_code == 200:
            print("SUCCESS: Booking created.")
            return True
        else:
            print(f"FAILURE (Unexpected): {response.text}")
            return False
    else:
        if response.status_code != 200:
            print(f"SUCCESS (Expected Failure): {response.json()['detail']}")
            return True
        else:
            print("FAILURE (Unexpected Success): Booking should have been rejected.")
            return False

def run_tests():
    # Clear previous appointments for this slot if any (Manual cleanup or just choose new slot)
    # Since we don't have a clear ID based delete easily here without query, let's pick a unique time.
    # Using a far future Monday to be safe.
    TEST_TIME = "2026-10-05T09:00:00" 
    
    print("--- Test 1: Duplicate Booking Check ---")
    # 1. Book once
    book(CLIENT_EMAIL, TRAINER_ID, TEST_TIME, expect_success=True)
    # 2. Book again (Same user, same slot) - Should Fail
    book(CLIENT_EMAIL, TRAINER_ID, TEST_TIME, expect_success=False)
    
    print("\n--- Test 2: Trainer Capacity (Max 2) ---")
    TRAINER_CAP_TIME = "2026-10-05T10:00:00"
    # 1. Book Client 1
    book("alice@gym.com", TRAINER_ID, TRAINER_CAP_TIME, expect_success=True)
    # 2. Book Client 2
    book("bob@gym.com", TRAINER_ID, TRAINER_CAP_TIME, expect_success=True)
    # 3. Book Client 3 - Should Fail (Max 2 per trainer)
    book("charlie@gym.com", TRAINER_ID, TRAINER_CAP_TIME, expect_success=False)

if __name__ == "__main__":
    run_tests()
