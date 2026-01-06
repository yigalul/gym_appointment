import requests
import sys
import time

BASE_URL = "http://127.0.0.1:8000"

def reset_db():
    print("Resetting DB...")
    # Using the test-seed endpoint which we can repurpose or just delete db file manually.
    # Since we can't easily delete file via API, let's just rely on clean state or specific times
    # Actually, let's just use unique times for this test run to avoid conflicts
    pass

def test_capacity():

    # 1. Create a Trainer User & Profile
    print("Creating Trainer A...")
    ts = int(time.time())
    u1 = requests.post(f"{BASE_URL}/users/", json={"email": f"t1_{ts}@test.com", "password": "pw", "role": "trainer"}).json()
    t1 = requests.post(f"{BASE_URL}/trainers/", json={"name": f"T1_{ts}", "role": "Coach", "user_id": u1['id'], "photo_url": ""}).json()

    print("Creating Trainer B...")
    u2 = requests.post(f"{BASE_URL}/users/", json={"email": f"t2_{ts}@test.com", "password": "pw", "role": "trainer"}).json()
    t2 = requests.post(f"{BASE_URL}/trainers/", json={"name": f"T2_{ts}", "role": "Coach", "user_id": u2['id'], "photo_url": ""}).json()

    # Time slot for testing
    TEST_TIME = f"2024-01-01T{ts%24:02d}:{ts%60:02d}:00"

    print(f"\n--- Testing Per-Trainer Capacity (Max 2) for Trainer {t1['id']} ---")
    
    # Book 1
    resp = requests.post(f"{BASE_URL}/appointments/", json={
        "trainer_id": t1['id'], "client_name": "C1", "client_email": f"c1_{ts}@test.com", "start_time": TEST_TIME
    })
    print(f"Book 1: {resp.status_code} (Expected 200)")
    
    # Book 2
    resp = requests.post(f"{BASE_URL}/appointments/", json={
        "trainer_id": t1['id'], "client_name": "C2", "client_email": f"c2_{ts}@test.com", "start_time": TEST_TIME
    })
    print(f"Book 2: {resp.status_code} (Expected 200)")

    # Book 3 (Should Fail)
    resp = requests.post(f"{BASE_URL}/appointments/", json={
        "trainer_id": t1['id'], "client_name": "C3", "client_email": f"c3_{ts}@test.com", "start_time": TEST_TIME
    })
    print(f"Book 3: {resp.status_code} (Expected 400 - Trainer Full)")
    if resp.status_code == 400:
        print("PASS: Trainer capacity limit enforced.")
    else:
        print("FAIL: Trainer capacity check failed.")

    print(f"\n--- Testing Global Capacity (Max 3) ---")
    # Current State: T1 has 2 bookings. Total = 2.
    # Book 1 for T2 (Total = 3)
    resp = requests.post(f"{BASE_URL}/appointments/", json={
        "trainer_id": t2['id'], "client_name": "C4", "client_email": f"c4_{ts}@test.com", "start_time": TEST_TIME
    })
    print(f"Book T2-1: {resp.status_code} (Expected 200)")
    
    # Book 2 for T2 (Total = 4 -> Should Fail)
    resp = requests.post(f"{BASE_URL}/appointments/", json={
        "trainer_id": t2['id'], "client_name": "C5", "client_email": f"c5_{ts}@test.com", "start_time": TEST_TIME
    })
    print(f"Book T2-2: {resp.status_code} (Expected 400 - Gym Full)")
    if resp.status_code == 400 and "Gym capacity" in resp.text:
        print("PASS: Gym global capacity limit enforced.")
    else:
        print(f"FAIL: Gym capacity check failed. Status: {resp.status_code}, Body: {resp.text}")

if __name__ == "__main__":
    try:
        test_capacity()
    except Exception as e:
        print(f"Error: {e}")
