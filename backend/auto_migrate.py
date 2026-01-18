import logging
from sqlalchemy import text, inspect
from sqlalchemy.exc import OperationalError

logger = logging.getLogger(__name__)

def run_auto_migrations(engine):
    """
    Checks for missing columns and adds them (simple migration system).
    """
    logger.info("--- RUNNING AUTO MIGRATIONS ---")
    
    try:
        inspector = inspect(engine)
        if not inspector.has_table("users"):
            logger.info("Users table does not exist yet. Skipping migration (create_all will handle it).")
            return

        columns = [c["name"] for c in inspector.get_columns("users")]
        
        # Migration: Add workout_credits to users
        if "workout_credits" not in columns:
            logger.info("Migrating: Adding 'workout_credits' column to 'users' table.")
            with engine.connect() as conn:
                with conn.begin(): # Transaction
                    # SQLite supports ADD COLUMN (mostly), Postgres does too.
                    # Default 10 to match our logic
                    conn.execute(text("ALTER TABLE users ADD COLUMN workout_credits INTEGER DEFAULT 10"))
            logger.info("Migration successful: Added 'workout_credits'.")
        else:
            logger.info("Schema up to date: 'workout_credits' exists.")
            
    except Exception as e:
        logger.error(f"Migration failed: {e}")
