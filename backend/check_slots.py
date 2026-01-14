import sqlite3
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

conn = sqlite3.connect('gym.db')
cursor = conn.cursor()

def check_sarah():
    cursor.execute("SELECT id, name FROM trainers WHERE name LIKE '%Sarah%'")
    sarah = cursor.fetchone()
    if sarah:
        tid, name = sarah
        logger.info(f"Trainer: {name} (ID: {tid})")
        cursor.execute("SELECT * FROM availabilities WHERE trainer_id = ?", (tid,))
        rows = cursor.fetchall()
        logger.info(f"Found {len(rows)} slots:")
        for r in rows:
            logger.info(r)
    else:
        logger.warning("Sarah not found")

    conn.close()

if __name__ == "__main__":
    check_sarah()
