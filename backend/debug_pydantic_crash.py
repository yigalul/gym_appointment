from database import SessionLocal
from models import Trainer
from schemas import Trainer as TrainerSchema

def test_pydantic_crash():
    db = SessionLocal()
    try:
        print("Querying trainers from DB...")
        trainers = db.query(Trainer).all()
        print(f"Found {len(trainers)} trainers.")
        print("Attempting to validate with Pydantic...")
        
        for t in trainers:
            print(f"Validating Trainer {t.id} ({t.name})...")
            # Try to convert ORM object to Pydantic model
            try:
                pydantic_model = TrainerSchema.model_validate(t)
                print(f"  SUCCESS: {pydantic_model.name}")
            except Exception as e:
                print(f"  FAILED: {e}")
                # Print details
                import traceback
                traceback.print_exc()

    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_pydantic_crash()
