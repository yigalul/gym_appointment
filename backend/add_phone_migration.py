import sqlite3
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def migrate():
    conn = sqlite3.connect('gym.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN phone_number VARCHAR")
        logger.info("Successfully added phone_number column to users table.")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            logger.info("Column phone_number already exists.")
        else:
            logger.error(f"Error: {e}")
            
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
