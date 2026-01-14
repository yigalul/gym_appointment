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
    cursor.execute("ALTER TABLE availabilities ADD COLUMN is_recurring BOOLEAN DEFAULT 1")
    conn.commit()
    logger.info("Successfully added 'is_recurring' column to availabilities.")
except sqlite3.OperationalError as e:
    logger.error(f"Error: {e}")

conn.close()
