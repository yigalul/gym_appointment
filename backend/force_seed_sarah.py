import sqlite3

conn = sqlite3.connect('gym.db')
cursor = conn.cursor()

def fix_sarah():
    cursor.execute("SELECT id FROM trainers WHERE name LIKE '%Sarah%'")
    res = cursor.fetchone()
    if not res:
        print("Sarah not found!")
        return
    
    tid = res[0]
    print(f"Fixing slots for Trainer ID {tid}...")
    
    # Delete old
    cursor.execute("DELETE FROM availabilities WHERE trainer_id = ?", (tid,))
    print(f"Deleted old slots.")
    
    # Add new (Mon-Fri, 9-17)
    availabilities = []
    days = [1, 2, 3, 4, 5] 
    for day in days:
        for hour in range(9, 17):
            start_time = f"{hour:02d}:00"
            end_time = f"{hour+1:02d}:00"
            availabilities.append((tid, day, start_time, end_time))
    
    cursor.executemany("INSERT INTO availabilities (trainer_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)", availabilities)
    conn.commit()
    print(f"Added {len(availabilities)} new slots.")
    conn.close()

if __name__ == "__main__":
    fix_sarah()
