
from sqlalchemy import create_engine, text
import os

# Database URL
DATABASE_URL = "sqlite:///./gym.db"

def migrate():
    engine = create_engine(DATABASE_URL)
    connection = engine.connect()

    try:
        print("Migrating: Adding profile_picture_url column to users table...")
        # Check if column exists first to avoid error
        try:
            connection.execute(text("SELECT profile_picture_url FROM users LIMIT 1"))
            print("Column 'profile_picture_url' already exists.")
        except Exception:
            # Add column
            connection.execute(text("ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR"))
            print("Successfully added 'profile_picture_url' column.")
            
        connection.commit()
    except Exception as e:
        print(f"Migration Failed: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    migrate()
