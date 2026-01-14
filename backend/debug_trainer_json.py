import requests
import json
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"

def debug_trainer():
    # 1. Get Trainer
    trainers = requests.get(f"{BASE_URL}/trainers/").json()
    if not trainers:
        logger.warning("No trainers found.")
        return
    trainer_id = trainers[0]['id']
    
    r = requests.get(f"{BASE_URL}/trainers/{trainer_id}")
    logger.info(json.dumps(r.json(), indent=2))

if __name__ == "__main__":
    debug_trainer()
