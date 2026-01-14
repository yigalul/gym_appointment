import sqlite3
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Connect to the SQLite database
conn = sqlite3.connect('gym.db')
cursor = conn.cursor()

try:
    # Attempt to add the new column
    cursor.execute("ALTER TABLE users ADD COLUMN weekly_workout_limit INTEGER DEFAULT 3")
    conn.commit()
    logger.info("Successfully added 'weekly_workout_limit' column.")
except sqlite3.OperationalError as e:
    logger.error(f"Error: {e}")

conn.close()
