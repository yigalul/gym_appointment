import requests
import json

BASE_URL = "http://localhost:8000"

def debug_trainer():
    # 1. Get Trainer
    trainers = requests.get(f"{BASE_URL}/trainers/").json()
    if not trainers:
        print("No trainers found.")
        return
    trainer_id = trainers[0]['id']
    
    r = requests.get(f"{BASE_URL}/trainers/{trainer_id}")
    print(json.dumps(r.json(), indent=2))

if __name__ == "__main__":
    debug_trainer()
