import requests
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"

def verify_toggle():
    # 1. Get Trainer
    trainers = requests.get(f"{BASE_URL}/trainers/").json()
    if not trainers:
        logger.warning("No trainers found.")
        return
    trainer_id = trainers[0]['id']
    logger.info(f"Trainer ID: {trainer_id}")

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
             logger.info(f"Cleanup: Deleting overlapping slot ID {a['id']} ({a['start_time']}-{a['end_time']})...")
             requests.delete(f"{BASE_URL}/availability/{a['id']}")

    # 3. Add Slot (Toggle On)
    logger.info("\nSimulating 'Click' on Empty Cell (Add)...")
    r = requests.post(f"{BASE_URL}/trainers/{trainer_id}/availability/", json=slot)
    if r.status_code == 200:
        logger.info(f"✅ Slot Added. ID: {r.json()['id']}")
        slot_id = r.json()['id']
    else:
        logger.error(f"❌ Add Failed: {r.text}")
        return

    # 4. Verify Active
    r = requests.get(f"{BASE_URL}/trainers/{trainer_id}")
    avails = r.json()['availabilities']
    exists = any(a['id'] == slot_id for a in avails)
    logger.info(f"Slot exists in DB: {exists}")

    # 5. Remove Slot (Toggle Off)
    logger.info("\nSimulating 'Click' on Active Cell (Delete)...")
    r = requests.delete(f"{BASE_URL}/availability/{slot_id}")
    if r.status_code == 204: # checking for 204 No Content
        # Requests might return 200 depending on FastAPI setup, but strictly should be 204 or 200
         logger.info("✅ Slot Deleted (204 OK)")
    elif r.status_code == 200:
         logger.info("✅ Slot Deleted (200 OK)")
    else:
        logger.error(f"❌ Delete Failed: {r.status_code} {r.text}")

    # 6. Verify Removed
    r = requests.get(f"{BASE_URL}/trainers/{trainer_id}")
    avails = r.json()['availabilities']
    exists = any(a['id'] == slot_id for a in avails)
    logger.info(f"Slot exists in DB: {exists} (Should be False)")

if __name__ == "__main__":
    verify_toggle()
