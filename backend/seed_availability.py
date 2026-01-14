import sqlite3
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Connect to the SQLite database
conn = sqlite3.connect('gym.db')
cursor = conn.cursor()

def seed_availability():
    try:
        # Get all trainers
        cursor.execute("SELECT id, name FROM trainers")
        trainers = cursor.fetchall()
        
        logger.info(f"Found {len(trainers)} trainers.")

        for trainer in trainers:
            trainer_id, name = trainer
            logger.info(f"Checking availability for {name} (ID: {trainer_id})...")
            
            # Check if they have any availability
            cursor.execute("SELECT count(*) FROM availabilities WHERE trainer_id = ?", (trainer_id,))
            count = cursor.fetchone()[0]
            
            if count == 0:
                logger.info(f"No availability found for {name}. Adding default slots (Mon-Fri, 09:00-17:00)...")
                
                # Add Mon-Fri (1-5), 9am to 5pm
                availabilities = []
                days = [1, 2, 3, 4, 5] # Mon, Tue, Wed, Thu, Fri
                
                # Define 1-hour slots from 9 to 17
                for day in days:
                    for hour in range(9, 17):
                        start_time = f"{hour:02d}:00"
                        end_time = f"{hour+1:02d}:00"
                        availabilities.append((trainer_id, day, start_time, end_time))
                
                cursor.executemany("INSERT INTO availabilities (trainer_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)", availabilities)
                conn.commit()
                logger.info(f"Added {len(availabilities)} slots for {name}.")
            else:
                logger.info(f"{name} already has {count} slots.")
                
    except sqlite3.OperationalError as e:
        logger.error(f"Database Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed_availability()
