import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('gym.db')
cursor = conn.cursor()

try:
    # Attempt to add the new column
    cursor.execute("ALTER TABLE users ADD COLUMN weekly_workout_limit INTEGER DEFAULT 3")
    conn.commit()
    print("Successfully added 'weekly_workout_limit' column.")
except sqlite3.OperationalError as e:
    print(f"Error: {e}")

conn.close()
