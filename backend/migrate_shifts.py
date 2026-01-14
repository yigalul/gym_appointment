from database import SessionLocal
import models
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def migrate():
    db = SessionLocal()
    try:
        # 1. Expand Morning Shifts (07-12 -> 07-13)
        mornings = db.query(models.Availability).filter(
            models.Availability.end_time == "12:00"
        ).all()
        logger.info(f"Updating {len(mornings)} morning shifts -> 13:00")
        for m in mornings:
            m.end_time = "13:00"
            
        # 2. Expand Evening Shifts (15-20 -> 15-21)
        evenings = db.query(models.Availability).filter(
            models.Availability.end_time == "20:00"
        ).all()
        logger.info(f"Updating {len(evenings)} evening shifts -> 21:00")
        for e in evenings:
            e.end_time = "21:00"
            
        db.commit()
        db.commit()
        logger.info("✅ Migration Complete")
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
