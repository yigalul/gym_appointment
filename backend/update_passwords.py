import sqlite3

DB_PATH = 'gym.db'
NEW_PASSWORD = 'GymStrong2026!'

def update_passwords():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Update specific users 
        users_to_update = [
            'admin@gym.com', 
            'sarah@gym.com', 
            'client@example.com',
            'mike@gym.com',
            'alice@gym.com',
            'bob@gym.com',
            'charlie@gym.com'
        ]
        
        # Or just update ALL users for simplicity as requested "change admin and all old users passwords"
        cursor.execute("UPDATE users SET hashed_password = ?", (NEW_PASSWORD,))
        rows = cursor.rowcount
        
        conn.commit()
        print(f"Successfully updated passwords for {rows} users to '{NEW_PASSWORD}'")
        
    except sqlite3.OperationalError as e:
        print(f"Database Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    update_passwords()
