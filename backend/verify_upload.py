
import requests
import os

BASE_URL = "http://localhost:8000"

def test_upload():
    print("--- Testing Image Upload ---")
    
    # 1. Create a dummy file
    filename = "test_image.txt"
    with open(filename, "w") as f:
        f.write("This is a test image content.")
        
    # 2. Upload File
    print("Uploading file...")
    with open(filename, "rb") as f:
        files = {"file": (filename, f, "text/plain")}
        resp = requests.post(f"{BASE_URL}/upload/", files=files)
        
    if resp.status_code == 200:
        data = resp.json()
        print("Upload Success!")
        print(f"URL: {data['url']}")
        
        # Verify URL is accessible
        img_url = data['url']
        # Since localhost mapping might differ if running inside container vs host, 
        # let's try to access it via requests
        check_resp = requests.get(img_url)
        if check_resp.status_code == 200:
             print("File verified accessible via URL.")
        else:
             print(f"Failed to access file at URL: {check_resp.status_code}")
             
    else:
        print("Upload Failed:", resp.text)
        
    # Cleanup
    if os.path.exists(filename):
        os.remove(filename)

if __name__ == "__main__":
    test_upload()
