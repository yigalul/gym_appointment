import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('gym.db')
cursor = conn.cursor()

try:
    # Attempt to add the new column
    cursor.execute("ALTER TABLE availabilities ADD COLUMN is_recurring BOOLEAN DEFAULT 1")
    conn.commit()
    print("Successfully added 'is_recurring' column to availabilities.")
except sqlite3.OperationalError as e:
    print(f"Error: {e}")

conn.close()
