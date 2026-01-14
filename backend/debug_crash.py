from database import SessionLocal
from models import Trainer
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_crash():
    db = SessionLocal()
    try:
        logger.info("Querying trainers...")
        trainers = db.query(Trainer).all()
        logger.info(f"Found {len(trainers)} trainers.")
        for t in trainers:
            logger.info(f"- {t.name} ({len(t.availabilities)} availabilities)")
            for a in t.availabilities:
                logger.info(f"  - {a.day_of_week} {a.start_time}-{a.end_time} recur={a.is_recurring}")
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
    finally:
        db.close()

if __name__ == "__main__":
    test_crash()
