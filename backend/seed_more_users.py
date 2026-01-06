import requests
import json

API_URL = "http://127.0.0.1:8000"
PASSWORD = "GymStrong2026!"

def create_user(email, role):
    response = requests.post(f"{API_URL}/users/", json={
        "email": email,
        "password": PASSWORD,
        "role": role,
        "weekly_workout_limit": 3 if role == 'client' else 0,
        "default_slots": []
    })
    if response.status_code == 200:
        print(f"User created: {email}")
        return response.json()
    else:
        print(f"Failed to create user {email}: {response.text}")
        return None

def create_trainer(name, user_id):
    response = requests.post(f"{API_URL}/trainers/", json={
        "name": name,
        "role": "High Intensity Coach",
        "bio": "Expert in high intensity training.",
        "user_id": user_id,
        "photo_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=200&h=200"
    })
    if response.status_code == 200:
        print(f"Trainer created: {name}")
    else:
        print(f"Failed to create trainer {name}: {response.text}")

# Main execution
if __name__ == "__main__":
    # Create Trainer
    mike_user = create_user("mike@gym.com", "trainer")
    if mike_user:
        create_trainer("Mike Mentzer", mike_user["id"])

    # Create Clients
    create_user("alice@gym.com", "client")
    create_user("bob@gym.com", "client")
    create_user("charlie@gym.com", "client")
