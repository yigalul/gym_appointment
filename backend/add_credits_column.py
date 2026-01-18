import sqlite3

def add_column():
    print("--- Adding workout_credits column ---")
    conn = sqlite3.connect('gym.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN workout_credits INTEGER DEFAULT 10")
        print("Column 'workout_credits' added successfully.")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
             print("Column 'workout_credits' already exists.")
        else:
            print(f"Error: {e}")
            
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_column()
