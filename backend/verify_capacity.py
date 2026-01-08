
import requests
import datetime

BASE_URL = "http://localhost:8000"

def run():
    # 1. Create Trainer
    t_name = f"CapTester_{datetime.datetime.now().timestamp()}"
    u_email = f"trainer_{datetime.datetime.now().timestamp()}@test.com"
    
    # Create User for Trainer
    requests.post(f"{BASE_URL}/users/", json={"email": u_email, "password": "123", "role": "trainer"})
    u_res = requests.get(f"{BASE_URL}/users/").json()
    u_id = next(u for u in u_res if u["email"] == u_email)["id"]
    
    # Create Trainer Profile
    t_res = requests.post(f"{BASE_URL}/trainers/", json={
        "name": t_name,
        "role": "tester",
        "user_id": u_id,
        "photo_url": "http://x"
    })
    if t_res.status_code != 200:
        print("Failed to create trainer", t_res.text)
        return
    tid = t_res.json()["id"]

    # 2. Add Availability (Friday 12:00-13:00)
    # Day 4 = Friday (if 0=Mon)
    requests.post(f"{BASE_URL}/trainers/{tid}/availability/", json={
        "day_of_week": 4, 
        "start_time": "12:00",
        "end_time": "13:00"
    })

    # 3. Create Clients
    c1_email = f"c1_{datetime.datetime.now().timestamp()}@test.com"
    c2_email = f"c2_{datetime.datetime.now().timestamp()}@test.com"
    c3_email = f"c3_{datetime.datetime.now().timestamp()}@test.com"

    requests.post(f"{BASE_URL}/users/", json={"email": c1_email, "password": "123", "role": "client", "weekly_workout_limit": 3})
    requests.post(f"{BASE_URL}/users/", json={"email": c2_email, "password": "123", "role": "client", "weekly_workout_limit": 3})
    requests.post(f"{BASE_URL}/users/", json={"email": c3_email, "password": "123", "role": "client", "weekly_workout_limit": 3})
    
    users = requests.get(f"{BASE_URL}/users/").json()
    cid1 = next(u for u in users if u["email"] == c1_email)["id"]
    cid2 = next(u for u in users if u["email"] == c2_email)["id"]
    cid3 = next(u for u in users if u["email"] == c3_email)["id"]

    # Calculate next Friday
    today = datetime.date.today()
    friday = today + datetime.timedelta((4 - today.weekday()) % 7)
    if friday == today and datetime.datetime.now().hour >= 12:
        friday += datetime.timedelta(days=7) # Next week if passed
    
    start_time = f"{friday}T12:00:00"
    print(f"Testing Booking for {start_time}")

    # 4. Book Client A
    print("Booking Client A...")
    r1 = requests.post(f"{BASE_URL}/appointments/", json={
        "trainer_id": tid,
        "client_id": cid1,
        "client_name": "C1",
        "client_email": c1_email,
        "start_time": start_time,
        "status": "confirmed"
    })
    print("Client A:", r1.status_code, r1.text)

    # 5. Book Client B
    print("Booking Client B...")
    r2 = requests.post(f"{BASE_URL}/appointments/", json={
        "trainer_id": tid,
        "client_id": cid2,
        "client_name": "C2",
        "client_email": c2_email,
        "start_time": start_time,
        "status": "confirmed"
    })
    print("Client B:", r2.status_code, r2.text)

    # 6. Book Client C (Should Fail)
    print("Booking Client C...")
    r3 = requests.post(f"{BASE_URL}/appointments/", json={
        "trainer_id": tid,
        "client_id": cid3,
        "client_name": "C3",
        "client_email": c3_email,
        "start_time": start_time,
        "status": "confirmed"
    })
    print("Client C:", r3.status_code) # Expect 400

if __name__ == "__main__":
    run()
