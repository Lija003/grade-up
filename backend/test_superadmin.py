from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

def test_superadmin_perms():
    print("Testing SUPERADMIN and ADMIN permissions isolation...")

    # 1. Login as ADMIN
    res = client.post("/auth/token", data={"username": "admin_demo", "password": "admin123"})
    if res.status_code != 200:
        print("Failed to login as ADMIN!")
        return
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("  [OK] Logged in as ADMIN")

    # 2. Login as SUPERADMIN
    res = client.post("/auth/token", data={"username": "admin", "password": "123"})
    if res.status_code != 200:
        print("Failed to login as SUPERADMIN!")
        return
    super_token = res.json()["access_token"]
    super_headers = {"Authorization": f"Bearer {super_token}"}
    print("  [OK] Logged in as SUPERADMIN")

    # 3. ADMIN tries to create an ADMIN (should fail)
    res = client.post("/users/", json={"username": "admin2", "email": "admin2@test.com", "password": "123", "role": "admin"}, headers=admin_headers)
    if res.status_code == 403:
        print("  [OK] ADMIN blocked from creating ADMIN")
    else:
        print(f"  [FAIL] ADMIN created ADMIN (Status {res.status_code}): {res.text}")

    # 4. SUPERADMIN tries to create an ADMIN (should succeed)
    res = client.post("/users/", json={"username": "admin3", "email": "admin3@test.com", "password": "123", "role": "admin"}, headers=super_headers)
    if res.status_code == 200:
        admin3_id = res.json()["id"]
        print("  [OK] SUPERADMIN successfully created ADMIN (id {})".format(admin3_id))
    else:
        print(f"  [FAIL] SUPERADMIN failed to create ADMIN (Status {res.status_code}): {res.text}")
        return

    # 5. ADMIN tries to delete ADMIN (should fail)
    res = client.delete(f"/users/{admin3_id}", headers=admin_headers)
    if res.status_code == 403:
        print("  [OK] ADMIN blocked from deleting ADMIN")
    else:
        print(f"  [FAIL] ADMIN deleted ADMIN (Status {res.status_code}): {res.text}")

    # 6. SUPERADMIN tries to delete SUPERADMIN (should fail)
    # the superadmin is id 1
    res = client.delete("/users/1", headers=super_headers)
    if res.status_code in [400, 403]:
        print("  [OK] SUPERADMIN blocked from deleting self/SUPERADMIN")
    else:
        print(f"  [FAIL] SUPERADMIN deleted self (Status {res.status_code}): {res.text}")

    # 7. SUPERADMIN tries to delete ADMIN (should succeed)
    res = client.delete(f"/users/{admin3_id}", headers=super_headers)
    if res.status_code == 204:
        print("  [OK] SUPERADMIN successfully deleted ADMIN")
    else:
        print(f"  [FAIL] SUPERADMIN failed to delete ADMIN (Status {res.status_code}): {res.text}")

if __name__ == "__main__":
    test_superadmin_perms()
