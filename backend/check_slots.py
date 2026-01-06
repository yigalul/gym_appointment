import sqlite3

conn = sqlite3.connect('gym.db')
cursor = conn.cursor()

def check_sarah():
    cursor.execute("SELECT id, name FROM trainers WHERE name LIKE '%Sarah%'")
    sarah = cursor.fetchone()
    if sarah:
        tid, name = sarah
        print(f"Trainer: {name} (ID: {tid})")
        cursor.execute("SELECT * FROM availabilities WHERE trainer_id = ?", (tid,))
        rows = cursor.fetchall()
        print(f"Found {len(rows)} slots:")
        for r in rows:
            print(r)
    else:
        print("Sarah not found")

    conn.close()

if __name__ == "__main__":
    check_sarah()
