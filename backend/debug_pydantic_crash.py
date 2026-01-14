from database import SessionLocal
from models import Trainer
from schemas import Trainer as TrainerSchema
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_pydantic_crash():
    db = SessionLocal()
    try:
        logger.info("Querying trainers from DB...")
        trainers = db.query(Trainer).all()
        logger.info(f"Found {len(trainers)} trainers.")
        logger.info("Attempting to validate with Pydantic...")
        
        for t in trainers:
            logger.info(f"Validating Trainer {t.id} ({t.name})...")
            # Try to convert ORM object to Pydantic model
            try:
                pydantic_model = TrainerSchema.model_validate(t)
                logger.info(f"  SUCCESS: {pydantic_model.name}")
            except Exception as e:
                logger.error(f"  FAILED: {e}")
                # Print details
                logger.error(f"Error: {e}", exc_info=True)

    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
    finally:
        db.close()

if __name__ == "__main__":
    test_pydantic_crash()
