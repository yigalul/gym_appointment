import sqlite3

def migrate():
    conn = sqlite3.connect('gym.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN phone_number VARCHAR")
        print("Successfully added phone_number column to users table.")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("Column phone_number already exists.")
        else:
            print(f"Error: {e}")
            
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
