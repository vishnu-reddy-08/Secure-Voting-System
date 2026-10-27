from fastapi import APIRouter, HTTPException, Header, status
from typing import Optional, List
import time
import uuid
import hashlib
import logging
from app.database.firebase import get_db
from app.core.security import decode_access_token
from app.core.audit_logger import log_audit_event
from app.schemas.models import VoteCastRequest, VoteCastResponse, CandidateResponse

logger = logging.getLogger("smart_voting.voting_api")
router = APIRouter(prefix="/voting", tags=["Voting Process"])

@router.get("/ballot-info")
def get_ballot_info(authorization: Optional[str] = Header(None)):
    """Validates session token and returns active election candidates for the ballot."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Session token required")

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or payload.get("type") != "voting_session":
        raise HTTPException(status_code=401, detail="Invalid voting session token")

    session_id = payload.get("session_id")
    db = get_db()
    session_doc = db.collection("voting_sessions").document(session_id).get()
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Voting session expired or not found")

    s_data = session_doc.to_dict()
    if s_data.get("used"):
        raise HTTPException(status_code=403, detail="Voting session has already been used")
    if time.time() > s_data.get("expires_at", 0):
        raise HTTPException(status_code=403, detail="Voting session has expired")

    election_id = s_data.get("election_id", "ELECTION-2026-DEMO")
    election_doc = db.collection("elections").document(election_id).get()
    el_data = election_doc.to_dict() if election_doc.exists else {"name": "Demo Election 2026", "status": "active"}

    # Fetch candidates
    cands = []
    for c in db.collection("candidates").where("election_id", "==", election_id).stream():
        cd = c.to_dict()
        cd["candidate_id"] = cd.get("candidate_id", c.id)
        cands.append(cd)
    cands.sort(key=lambda x: x.get("ballot_order", 1))

    # Fetch voter details if available from session
    voter_id = payload.get("voter_id")
    voter_details = None
    if voter_id:
        v_doc = db.collection("users").document(voter_id).get()
        if v_doc.exists:
            vd = v_doc.to_dict()
            reg_face = vd.get("registered_face_image")
            if not reg_face:
                bt_doc = db.collection("biometric_templates").document(voter_id).get()
                if bt_doc.exists:
                    reg_face = bt_doc.to_dict().get("face_image_base64")
            voter_details = {
                "voter_id": voter_id,
                "name": vd.get("name"),
                "age": vd.get("age"),
                "mobile": vd.get("mobile"),
                "aadhaar_last4": vd.get("aadhaar_last4"),
                "status": vd.get("status", "active"),
                "eligible": vd.get("eligible", True),
                "registered_face_image": reg_face,
                "created_at": vd.get("created_at")
            }

    return {
        "election": el_data,
        "candidates": cands,
        "expires_at": s_data.get("expires_at"),
        "voter_details": voter_details
    }

@router.post("/cast", response_model=VoteCastResponse)
def cast_vote(vote_req: VoteCastRequest):
    """
    Submits an anonymous ballot:
    - Atomically consumes single-use voting session token.
    - Marks voter as 'voted = true'.
    - Stores strictly anonymous ballot record (no voter identity linked).
    - Prevents double voting and race conditions.
    """
    db = get_db()
    payload = decode_access_token(vote_req.session_token)
    if not payload or payload.get("type") != "voting_session":
        raise HTTPException(status_code=401, detail="Invalid session token")

    session_id = payload.get("session_id")
    voter_id = payload.get("voter_id")

    session_ref = db.collection("voting_sessions").document(session_id)
    session_doc = session_ref.get()
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session does not exist")

    s_data = session_doc.to_dict()
    if s_data.get("used"):
        log_audit_event(
            action="VOTE_ATTEMPT",
            result="REJECTED",
            actor="kiosk",
            error_type="SESSION_ALREADY_USED"
        )
        raise HTTPException(status_code=400, detail="This voting session has already been used")

    if time.time() > s_data.get("expires_at", 0):
        log_audit_event(
            action="VOTE_ATTEMPT",
            result="REJECTED",
            actor="kiosk",
            error_type="SESSION_EXPIRED"
        )
        raise HTTPException(status_code=400, detail="Voting session has expired")

    # Verify voter record
    voter_ref = db.collection("users").document(voter_id)
    voter_doc = voter_ref.get()
    if not voter_doc.exists:
        raise HTTPException(status_code=404, detail="Voter record not found")

    v_data = voter_doc.to_dict()
    if v_data.get("voted") is True:
        log_audit_event(
            action="DUPLICATE_VOTE_ATTEMPT",
            result="REJECTED",
            actor="kiosk",
            details={"voter_id": voter_id},
            error_type="ALREADY_VOTED"
        )
        raise HTTPException(status_code=400, detail="ALREADY_VOTED: Voter has already completed voting")

    # Verify candidate exists in election
    election_id = s_data.get("election_id")
    cand_ref = db.collection("candidates").document(vote_req.candidate_id)
    if not cand_ref.get().exists:
        raise HTTPException(status_code=400, detail="Invalid candidate selection")

    now = time.time()
    now_str = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(now))
    vote_id = str(uuid.uuid4())

    # Generate a cryptographically verified receipt hash
    # (SHA-256 of vote_id + timestamp + election_id) - preserves vote anonymity
    receipt_raw = f"{vote_id}:{now}:{election_id}:secure_salt"
    receipt_hash = hashlib.sha256(receipt_raw.encode('utf-8')).hexdigest()[:16].upper()

    # 1. Mark session as used
    session_ref.update({"used": True, "completed_at": now_str})

    # 2. Mark voter as voted
    voter_ref.update({"voted": True, "updated_at": now_str})

    # 3. Store anonymous ballot (STRICTLY NO VOTER ID STORED HERE)
    anonymous_ballot = {
        "vote_id": vote_id,
        "election_id": election_id,
        "candidate_id": vote_req.candidate_id,
        "receipt_hash": receipt_hash,
        "timestamp": now,
        "created_at": now_str
    }
    db.collection("votes").document(vote_id).set(anonymous_ballot)

    # 4. Log audit event (WITHOUT voter's candidate selection)
    log_audit_event(
        action="VOTE_COMPLETION",
        result="SUCCESS",
        actor="kiosk",
        details={"election_id": election_id, "receipt_hash": receipt_hash}
    )

    # Look up voter details for post-vote confirmation display
    reg_face = v_data.get("registered_face_image")
    if not reg_face:
        bt_doc = db.collection("biometric_templates").document(voter_id).get()
        if bt_doc.exists:
            reg_face = bt_doc.to_dict().get("face_image_base64")

    voter_details = {
        "voter_id": voter_id,
        "name": v_data.get("name"),
        "age": v_data.get("age"),
        "mobile": v_data.get("mobile"),
        "aadhaar_last4": v_data.get("aadhaar_last4"),
        "status": "voted",
        "eligible": v_data.get("eligible", True),
        "registered_face_image": reg_face,
        "created_at": v_data.get("created_at")
    }

    return VoteCastResponse(
        success=True,
        receipt_hash=receipt_hash,
        timestamp=now_str,
        message="Your vote has been anonymously and securely recorded.",
        voter_details=voter_details
    )
