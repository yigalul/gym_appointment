from database import SessionLocal
from models import Appointment

def list_appointments():
    db = SessionLocal()
    try:
        appointments = db.query(Appointment).all()
        print(f"Total Appointments: {len(appointments)}")
        for i, appt in enumerate(appointments):
            print(f"{i+1}. ID: {appt.id}, Date: {appt.start_time}, Status: {appt.status}, Client: {appt.client_email}, Trainer: {appt.trainer_id}")
    finally:
        db.close()

if __name__ == "__main__":
    list_appointments()
