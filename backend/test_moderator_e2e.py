import os
from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

def run_tests():
    print("Beginning E2E Moderator Tests...")
    
    # 1. Login as moderator
    print("1. Logging in as moderator...")
    response = client.post("/auth/token", data={"username": "moderator_demo", "password": "mod123"})
    if response.status_code != 200:
        print("Failed to login as moderator!", response.text)
        return
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 2. Create Group
    print("2. Creating Group...")
    res = client.post("/hierarchy/groups", json={"name": "E2E Test Group"}, headers=headers)
    assert res.status_code == 200, f"Group creation failed: {res.text}"
    group_id = res.json()["id"]
    print(f"Group created (ID: {group_id})")

    # 3. Create Subject
    print("3. Creating Subject...")
    res = client.post("/hierarchy/subjects", json={"name": "E2E Subject", "group_id": group_id}, headers=headers)
    assert res.status_code == 200, f"Subject creation failed: {res.text}"
    subject_id = res.json()["id"]
    print(f"Subject created (ID: {subject_id})")

    # 4. Create Paper
    print("4. Creating Paper...")
    res = client.post("/hierarchy/papers", json={"name": "E2E Paper", "subject_id": subject_id}, headers=headers)
    assert res.status_code == 200, f"Paper creation failed: {res.text}"
    paper_id = res.json()["id"]
    print(f"Paper created (ID: {paper_id})")

    # 5. Create Chapter
    print("5. Creating Chapter...")
    res = client.post("/hierarchy/chapters", json={"name": "E2E Chapter", "paper_id": paper_id}, headers=headers)
    assert res.status_code == 200, f"Chapter creation failed: {res.text}"
    chapter_id = res.json()["id"]
    print(f"Chapter created (ID: {chapter_id})")

    # 6. Create Question Set
    print("6. Creating Question Set...")
    res = client.post("/questions/sets/", json={"title": "E2E Set", "description": "E2E Set", "chapter_id": chapter_id}, headers=headers)
    assert res.status_code == 200, f"Question Set creation failed: {res.text}"
    set_id = res.json()["id"]
    print(f"Question Set created (ID: {set_id})")

    # 7. Create Question
    print("7. Creating Question...")
    q_data = {
        "text": "E2E Question Text?",
        "option_a": "A",
        "option_b": "B",
        "option_c": "C",
        "option_d": "D",
        "correct_option": "A",
        "marks": 5.0,
        "difficulty": "hard",
        "image_url": None
    }
    res = client.post(f"/questions/sets/{set_id}/questions", json=q_data, headers=headers)
    assert res.status_code == 200, f"Question creation failed: {res.text}"
    print("Question created successfully:", res.json()["text"])

    # 8. Fetch Questions for Chapter
    print("8. Fetching Questions for Chapter...")
    res = client.get(f"/exams/chapter-questions/{chapter_id}", headers=headers)
    assert res.status_code == 200, f"Fetch questions failed: {res.text}"
    questions = res.json()
    print(f"Found {len(questions)} questions in chapter.")
    
    # 9. Test Teacher trying to create a question (Should Fail)
    print("9. Verifying Teacher RBAC...")
    teacher_res = client.post("/auth/token", data={"username": "teacher_demo", "password": "teacher123"})
    teacher_token = teacher_res.json().get("access_token")
    teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
    
    fail_res = client.post(f"/questions/sets/{set_id}/questions", json=q_data, headers=teacher_headers)
    assert fail_res.status_code == 403, f"Teacher was incorrectly allowed to create a question: {fail_res.text}"
    print("Teacher correctly blocked from question creation (HTTP 403).")
    
    print("\nALL E2E TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
