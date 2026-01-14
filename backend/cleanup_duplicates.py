from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from models import Base, Availability
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Connect to the correct database
DATABASE_URL = "sqlite:///./backend/gym.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def clean_duplicates():
    logger.info("Scanning for duplicate availabilities...")
    
    # query all availabilities
    all_avails = db.query(Availability).all()
    
    # Map key -> list of IDs
    # Key = (trainer_id, day_of_week, start_time, end_time)
    seen = {}
    duplicates = []

    for a in all_avails:
        key = (a.trainer_id, a.day_of_week, a.start_time, a.end_time)
        if key in seen:
            duplicates.append(a)
        else:
            seen[key] = a

    logger.info(f"Found {len(duplicates)} duplicate entries.")
    
    if duplicates:
        for dup in duplicates:
            logger.info(f"Deleting duplicate: ID {dup.id} - Trainer {dup.trainer_id} Day {dup.day_of_week} {dup.start_time}-{dup.end_time}")
            db.delete(dup)
        
        db.commit()
        db.commit()
        logger.info("✅ Duplicates deleted.")
    else:
        logger.info("No duplicates found.")

if __name__ == "__main__":
    try:
        clean_duplicates()
    except Exception as e:
        logger.error(f"Error: {e}")
