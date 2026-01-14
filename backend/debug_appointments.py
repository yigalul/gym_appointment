from database import SessionLocal
from models import Appointment
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def list_appointments():
    db = SessionLocal()
    try:
        appointments = db.query(Appointment).all()
        logger.info(f"Total Appointments: {len(appointments)}")
        for i, appt in enumerate(appointments):
            logger.info(f"{i+1}. ID: {appt.id}, Date: {appt.start_time}, Status: {appt.status}, Client: {appt.client_email}, Trainer: {appt.trainer_id}")
    finally:
        db.close()

if __name__ == "__main__":
    list_appointments()
