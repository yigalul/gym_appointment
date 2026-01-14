import requests
import datetime
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"

def test_restriction():
    # 1. Get a Trainer
    trainers = requests.get(f"{BASE_URL}/trainers/").json()
    if not trainers:
        logger.warning("No trainers found.")
        return
    trainer_id = trainers[0]['id']

    # 2. Get a Client
    users = requests.get(f"{BASE_URL}/users/").json()
    client = next((u for u in users if u['role'] == 'client'), None)
    if not client:
        logger.warning("No client found.")
        return
    
    logger.info(f"Testing with Client: {client['email']}")

    # 3. Try to book 07:00 (Should Work - or fail on duplicate/other, but not Restriction)
    # Use a future monday
    today = datetime.date.today()
    next_monday = today + datetime.timedelta(days=(7 - today.weekday()))
    
    # CASE A: 07:00 AM (Allowed Time)
    valid_time = f"{next_monday}T07:00:00"
    logger.info(f"\nAttempting 07:00 Book ({valid_time})...")
    
    payload_valid = {
        "trainer_id": trainer_id,
        "client_name": "Test",
        "client_email": client['email'],
        "start_time": valid_time,
        "client_id": client['id']
    }
    
    r = requests.post(f"{BASE_URL}/appointments/", json=payload_valid)
    if r.status_code == 200:
        logger.info("✅ 07:00 Booking Allowed (Success)")
        # Cleanup
        appt_id = r.json()['id']
        requests.put(f"{BASE_URL}/appointments/{appt_id}/cancel")
    elif "already have a booking" in r.text:
         logger.info("✅ 07:00 Booking Logic Passed (Already booked, but not restricted)")
    else:
        logger.error(f"⚠️ 07:00 Booking Failed (Unexpected): {r.text}")


    # CASE B: 15:00 PM (Restricted Time)
    invalid_time = f"{next_monday}T15:00:00"
    logger.info(f"\nAttempting 15:00 Book ({invalid_time})...")

    payload_invalid = payload_valid.copy()
    payload_invalid["start_time"] = invalid_time
    
    r = requests.post(f"{BASE_URL}/appointments/", json=payload_invalid)
    if r.status_code == 400 and "Clients can only book morning slots" in r.text:
        logger.info("✅ 15:00 Booking BLOCKED Correctly.")
    else:
        logger.error(f"❌ 15:00 Booking Check FAILED. Status: {r.status_code}, Resp: {r.text}")

if __name__ == "__main__":
    test_restriction()
