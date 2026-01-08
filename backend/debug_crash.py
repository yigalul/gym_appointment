from database import SessionLocal
from models import Trainer

def test_crash():
    db = SessionLocal()
    try:
        print("Querying trainers...")
        trainers = db.query(Trainer).all()
        print(f"Found {len(trainers)} trainers.")
        for t in trainers:
            print(f"- {t.name} ({len(t.availabilities)} availabilities)")
            for a in t.availabilities:
                print(f"  - {a.day_of_week} {a.start_time}-{a.end_time} recur={a.is_recurring}")
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_crash()
