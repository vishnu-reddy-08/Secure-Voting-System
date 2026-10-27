import pytest
import time
import base64
import numpy as np
import cv2
from fastapi.testclient import TestClient
from app.main import app
from app.database.init_db import initialize_database
from app.database.firebase import get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    db = get_db()
    if hasattr(db, "collections") and "biometric_templates" in db.collections:
        db.collections["biometric_templates"].clear()
    initialize_database()

def generate_test_face_base64(seed: int = 0):
    """Generates a synthetic test face image in base64 with a parameterized seed."""
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    img[:] = (30, 30, 30) # Dark background
    # Face ellipse
    cv2.ellipse(img, (320, 240), (100 + (seed % 10), 140 + (seed % 8)), 0, 0, 360, (200, 220, 240), -1)
    # Eyes
    cv2.circle(img, (280 - (seed % 5), 210), 16, (255, 255, 255), -1)
    cv2.circle(img, (360 + (seed % 5), 210), 16, (255, 255, 255), -1)
    # Pupils
    cv2.circle(img, (280 - (seed % 5), 210), 8, (40, 40, 40), -1)
    cv2.circle(img, (360 + (seed % 5), 210), 8, (40, 40, 40), -1)
    # Mouth
    cv2.ellipse(img, (320, 290), (30, 15), 0, 0, 180, (50, 50, 200), 3)
    _, buffer = cv2.imencode('.jpg', img)
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

def test_system_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_admin_auth_flow():
    # 1. Invalid login
    res_bad = client.post("/api/auth/login", json={
        "email": "admin@election.gov",
        "password": "WrongPassword123!"
    })
    assert res_bad.status_code == 401

    # 2. Valid login
    res = client.post("/api/auth/login", json={
        "email": "admin@election.gov",
        "password": "Admin@Voting2026!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    token = data["access_token"]

    # 3. Get profile
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "admin@election.gov"

def test_voter_crud_and_masking():
    # Login as admin
    login_res = client.post("/api/auth/login", json={
        "email": "admin@election.gov",
        "password": "Admin@Voting2026!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    unique_mobile_1 = f"98{int(time.time()*1000) % 100000000:08d}"
    # Create new voter with full 12-digit Aadhaar
    new_voter = {
        "name": "Priyanka Sen",
        "age": 29,
        "mobile": unique_mobile_1,
        "aadhaar_raw": "4892-0192-8833",
        "eligible": True
    }
    create_res = client.post("/api/admin/voters", json=new_voter, headers=headers)
    assert create_res.status_code == 200
    voter_data = create_res.json()
    voter_id = voter_data["voter_id"]
    
    # Assert Aadhaar data minimization (only last 4 stored)
    assert voter_data["aadhaar_last4"] == "8833"
    assert "4892" not in voter_data.get("aadhaar_raw", "")
    assert voter_data["voted"] is False

    # Prevent duplicate mobile
    dup_res = client.post("/api/admin/voters", json=new_voter, headers=headers)
    assert dup_res.status_code == 400

    # Get voter
    get_res = client.get(f"/api/admin/voters/{voter_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Priyanka Sen"

def test_biometric_enrollment_and_multimodal_voting_flow():
    # 1. Admin login
    admin_res = client.post("/api/auth/login", json={
        "email": "admin@election.gov",
        "password": "Admin@Voting2026!"
    })
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Register voter
    unique_mobile_2 = f"99{int(time.time()*1000 + 7) % 100000000:08d}"
    voter_res = client.post("/api/admin/voters", json={
        "name": "Devendra Kumar",
        "age": 31,
        "mobile": unique_mobile_2,
        "aadhaar_raw": "5566-7788-9900",
        "eligible": True
    }, headers=admin_headers)
    assert voter_res.status_code == 200
    voter_id = voter_res.json()["voter_id"]

    # 3. Enroll Multimodal Biometrics (Face + Iris)
    test_seed = int(time.time() * 1000) % 100000
    face_b64 = generate_test_face_base64(seed=test_seed)
    enroll_res = client.post("/api/biometric/enroll-multimodal", json={
        "voter_id": voter_id,
        "face_image_base64": face_b64,
        "iris_image_base64": face_b64
    }, headers=admin_headers)
    assert enroll_res.status_code == 200
    assert enroll_res.json()["success"] is True

    # 4. Multimodal Verification at Voter Kiosk
    verify_res = client.post("/api/biometric/verify-multimodal", json={
        "face_image_base64": face_b64,
        "iris_image_base64": face_b64
    })
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["success"] is True
    assert v_data["voter_id"] == voter_id
    assert "session_token" in v_data
    assert "voter_details" in v_data
    assert v_data["voter_details"] is not None
    assert v_data["voter_details"]["registered_face_image"] is not None
    session_token = v_data["session_token"]

    # 5. Access Ballot Paper with Session Token
    ballot_res = client.get("/api/voting/ballot-info", headers={
        "Authorization": f"Bearer {session_token}"
    })
    assert ballot_res.status_code == 200
    candidates = ballot_res.json()["candidates"]
    assert len(candidates) > 0
    selected_candidate_id = candidates[0]["candidate_id"]

    # 6. Cast Vote Anonymously
    cast_res = client.post("/api/voting/cast", json={
        "session_token": session_token,
        "candidate_id": selected_candidate_id
    })
    assert cast_res.status_code == 200
    cast_data = cast_res.json()
    assert cast_data["success"] is True
    assert "receipt_hash" in cast_data
    assert "voter_details" in cast_data
    assert cast_data["voter_details"] is not None
    assert cast_data["voter_details"]["registered_face_image"] is not None

    # 7. CRITICAL: DUPLICATE VOTE ATTEMPT (Same session token)
    second_cast = client.post("/api/voting/cast", json={
        "session_token": session_token,
        "candidate_id": selected_candidate_id
    })
    assert second_cast.status_code in [400, 401, 403]

    # 8. CRITICAL: DUPLICATE VOTE ATTEMPT (Same voter re-authenticating at kiosk)
    dup_verify = client.post("/api/biometric/verify-multimodal", json={
        "face_image_base64": face_b64,
        "iris_image_base64": face_b64
    })
    assert dup_verify.status_code == 200
    dup_data = dup_verify.json()
    assert dup_data["success"] is False
    assert dup_data["reason"] == "ALREADY_VOTED"
    assert "ALREADY VOTED" in dup_data["message"]

def test_audit_logs_recorded():
    # Login as admin to check audit logs
    admin_res = client.post("/api/auth/login", json={
        "email": "admin@election.gov",
        "password": "Admin@Voting2026!"
    })
    admin_token = admin_res.json()["access_token"]
    
    logs_res = client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) > 0
    actions = [log["action"] for log in logs]
    assert "ADMIN_LOGIN" in actions
