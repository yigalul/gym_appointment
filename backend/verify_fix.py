import requests
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

API_URL = "http://127.0.0.1:8000"

def verify_booking():
    # Use a new user or a user we know has slot limit left
    # Let's use 'bob@gym.com'
    client_email = "bob@gym.com"
    # Choose a unique slot far in future to avoid clashes
    time_slot = "2027-01-01T10:00:00"
    trainer_id = 1 # Sarah

    logger.info(f"Attempting booking for {client_email} at {time_slot}...")
    
    response = requests.post(f"{API_URL}/appointments/", json={
        "trainer_id": trainer_id,
        "client_name": "Bob Lifter",
        "client_email": client_email,
        "start_time": time_slot,
        "status": "confirmed"
    })

    if response.status_code == 200:
        logger.info("SUCCESS: Booking confirmed.")
        logger.info(response.json())
    else:
        logger.error(f"FAILURE: {response.status_code}")
        logger.error(response.text)

if __name__ == "__main__":
    verify_booking()
