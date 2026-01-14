import requests
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"

def test_duplicate_availability():
    # 1. Get first trainer
    trainers = requests.get(f"{BASE_URL}/trainers/").json()
    if not trainers:
        logger.warning("No trainers found.")
        return
    
    trainer_id = trainers[0]['id']
    logger.info(f"Testing with Trainer {trainer_id}")

    # 2. Define a valid slot (e.g., Monday Morning)
    # Using Monday (1) 07:00-12:00
    slot = {
        "day_of_week": 1,
        "start_time": "07:00",
        "end_time": "12:00",
        "is_recurring": True
    }

    # 3. Create FIRST time
    logger.info("\nAttempting 1st creation...")
    r1 = requests.post(f"{BASE_URL}/trainers/{trainer_id}/availability/", json=slot)
    
    if r1.status_code == 200:
        logger.info("✅ 1st creation successful (Expected)")
    else:
        logger.warning(f"⚠️ 1st creation failed: {r1.status_code} {r1.text}")
        # If it failed, maybe it already exists?
        # Proceed to try again to see if it allows duplicates regardless.

    # 4. Create SECOND time (Exact Duplicate)
    logger.info("\nAttempting 2nd creation (Duplicate)...")
    r2 = requests.post(f"{BASE_URL}/trainers/{trainer_id}/availability/", json=slot)
    
    if r2.status_code == 200:
        logger.error("❌ 2nd creation successful! (BUG DETECTED: Duplicate allowed)")
    elif r2.status_code == 400:
        logger.info("✅ 2nd creation failed (Expected behavior if fixed)")
        logger.info(f"Response: {r2.text}")
    else:
        logger.warning(f"❓ Unexpected status: {r2.status_code} {r2.text}")

if __name__ == "__main__":
    test_duplicate_availability()
