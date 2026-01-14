import requests
import datetime
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

API_URL = "http://127.0.0.1:8000"

def test_cancellation():
    # 1. Create a dummy appointment
    # Use a far future date to avoid clashes
    start_time = "2028-01-01T12:00:00"
    payload = {
        "trainer_id": 1,
        "client_name": "Test Cancel",
        "client_email": "cancel_test@gym.com",
        "start_time": start_time,
        "status": "confirmed"
    }
    
    logger.info("Creating appointment...")
    res = requests.post(f"{API_URL}/appointments/", json=payload)
    if res.status_code != 200:
        logger.error(f"Failed to create appointment: {res.text}")
        # If it failed because it exists, that's fine, we can try to find it
        if "already have a booking" in res.text:
             # Try to find it (we don't have a strict find-by-details endpoint usually exposed this way easily without list filtering)
             # Let's just list and find
             all_apps = requests.get(f"{API_URL}/appointments/").json()
             appt = next((a for a in all_apps if a['client_email'] == 'cancel_test@gym.com' and a['start_time'] == start_time), None)
             if not appt:
                 logger.error("Could not verify existing appointment.")
                 return
             logger.info(f"Found existing appointment ID: {appt['id']}")
             appt_id = appt['id']
        else:
             return
    else:
        appt = res.json()
        appt_id = appt['id']
        logger.info(f"Created appointment ID: {appt_id}")

    # 2. Cancel it
    logger.info(f"Cancelling appointment {appt_id}...")
    cancel_res = requests.put(f"{API_URL}/appointments/{appt_id}/cancel")
    
    if cancel_res.status_code == 200:
        data = cancel_res.json()
        if data['status'] == 'cancelled':
            logger.info("SUCCESS: Appointment cancelled.")
        else:
            logger.error(f"FAILURE: Status is {data['status']}")
    else:
        logger.error(f"FAILURE: API returned {cancel_res.status_code}")
        logger.error(cancel_res.text)

if __name__ == "__main__":
    test_cancellation()
