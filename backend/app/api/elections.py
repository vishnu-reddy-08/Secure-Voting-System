from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Dict, Any
import time
from app.database.firebase import get_db
from app.api.auth import get_current_admin
from app.schemas.models import (
    ElectionCreate, ElectionResponse,
    CandidateCreate, CandidateResponse, CandidateUpdate,
    DashboardStats, CandidateVoteStat
)
from app.core.audit_logger import log_audit_event

router = APIRouter(tags=["Elections & Candidates"])

# --- Election Endpoints ---

@router.post("/elections", response_model=ElectionResponse)
def create_election(el_in: ElectionCreate, admin: dict = Depends(get_current_admin)):
    db = get_db()
    election_id = el_in.election_id or f"ELECTION-{int(time.time())}"
    
    # Ensure no duplicate
    if db.collection("elections").document(election_id).get().exists:
        raise HTTPException(status_code=400, detail="Election with this ID already exists")
    
    now_str = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    election_doc = {
        "election_id": election_id,
        "name": el_in.name.strip(),
        "description": el_in.description or "",
        "start_time": el_in.start_time,
        "end_time": el_in.end_time,
        "status": el_in.status,
        "created_at": now_str
    }
    db.collection("elections").document(election_id).set(election_doc)
    
    log_audit_event(
        action="ELECTION_CREATE",
        result="SUCCESS",
        actor=admin["email"],
        details={"election_id": election_id, "name": el_in.name}
    )
    return {**election_doc, "candidate_count": 0, "total_votes": 0}

@router.get("/elections", response_model=List[ElectionResponse])
def list_elections():
    db = get_db()
    elections = []
    
    # Pre-count candidates and votes per election
    cand_counts = {}
    for c_doc in db.collection("candidates").stream():
        el_id = c_doc.to_dict().get("election_id")
        cand_counts[el_id] = cand_counts.get(el_id, 0) + 1
        
    vote_counts = {}
    for v_doc in db.collection("votes").stream():
        el_id = v_doc.to_dict().get("election_id")
        vote_counts[el_id] = vote_counts.get(el_id, 0) + 1

    for doc in db.collection("elections").stream():
        data = doc.to_dict()
        el_id = data.get("election_id", doc.id)
        data["election_id"] = el_id
        data["candidate_count"] = cand_counts.get(el_id, 0)
        data["total_votes"] = vote_counts.get(el_id, 0)
        elections.append(data)
        
    return elections

@router.get("/elections/{election_id}", response_model=ElectionResponse)
def get_election(election_id: str):
    db = get_db()
    doc = db.collection("elections").document(election_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Election not found")
    data = doc.to_dict()
    data["election_id"] = election_id
    cands = list(db.collection("candidates").where("election_id", "==", election_id).stream())
    votes = list(db.collection("votes").where("election_id", "==", election_id).stream())
    data["candidate_count"] = len(cands)
    data["total_votes"] = len(votes)
    return data

@router.put("/elections/{election_id}", response_model=ElectionResponse)
def update_election(election_id: str, el_in: ElectionCreate, admin: dict = Depends(get_current_admin)):
    db = get_db()
    doc_ref = db.collection("elections").document(election_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Election not found")
    
    update_data = {
        "name": el_in.name.strip(),
        "description": el_in.description or "",
        "start_time": el_in.start_time,
        "end_time": el_in.end_time,
        "status": el_in.status
    }
    doc_ref.update(update_data)
    
    full_data = doc_ref.get().to_dict()
    full_data["election_id"] = election_id
    cands = list(db.collection("candidates").where("election_id", "==", election_id).stream())
    votes = list(db.collection("votes").where("election_id", "==", election_id).stream())
    full_data["candidate_count"] = len(cands)
    full_data["total_votes"] = len(votes)
    return full_data

@router.delete("/elections/{election_id}")
def delete_election(election_id: str, admin: dict = Depends(get_current_admin)):
    db = get_db()
    doc_ref = db.collection("elections").document(election_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Election not found")
    doc_ref.delete()
    return {"message": f"Election {election_id} deleted"}

# --- Candidate Endpoints ---

@router.post("/candidates", response_model=CandidateResponse)
def create_candidate(c_in: CandidateCreate, admin: dict = Depends(get_current_admin)):
    db = get_db()
    # Verify election exists
    if not db.collection("elections").document(c_in.election_id).get().exists:
        raise HTTPException(status_code=400, detail="Target election does not exist")
        
    cand_id = c_in.candidate_id or f"CAND-{int(time.time())}"
    cand_doc = {
        "candidate_id": cand_id,
        "election_id": c_in.election_id,
        "name": c_in.name.strip(),
        "party": c_in.party.strip(),
        "symbol": c_in.symbol or "flag",
        "ballot_order": c_in.ballot_order
    }
    db.collection("candidates").document(cand_id).set(cand_doc)
    return cand_doc

@router.get("/candidates", response_model=List[CandidateResponse])
def list_candidates(election_id: Optional[str] = Query(None)):
    db = get_db()
    cands = []
    if election_id:
        stream = db.collection("candidates").where("election_id", "==", election_id).stream()
    else:
        stream = db.collection("candidates").stream()
        
    for doc in stream:
        data = doc.to_dict()
        data["candidate_id"] = data.get("candidate_id", doc.id)
        cands.append(data)
        
    cands.sort(key=lambda x: x.get("ballot_order", 1))
    return cands

@router.get("/candidates/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: str):
    db = get_db()
    doc = db.collection("candidates").document(candidate_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Candidate not found")
    data = doc.to_dict()
    data["candidate_id"] = data.get("candidate_id", doc.id)
    return data

@router.put("/candidates/{candidate_id}", response_model=CandidateResponse)
def update_candidate(candidate_id: str, c_in: CandidateUpdate, admin: dict = Depends(get_current_admin)):
    db = get_db()
    doc_ref = db.collection("candidates").document(candidate_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    update_data = {}
    if c_in.name is not None:
        update_data["name"] = c_in.name.strip()
    if c_in.party is not None:
        update_data["party"] = c_in.party.strip()
    if c_in.symbol is not None:
        update_data["symbol"] = c_in.symbol
    if c_in.ballot_order is not None:
        update_data["ballot_order"] = c_in.ballot_order

    doc_ref.update(update_data)
    data = doc_ref.get().to_dict()
    data["candidate_id"] = candidate_id
    return data

@router.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: str, admin: dict = Depends(get_current_admin)):
    db = get_db()
    doc_ref = db.collection("candidates").document(candidate_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Candidate not found")
    doc_ref.delete()
    return {"message": f"Candidate {candidate_id} deleted"}

# --- Dashboard Statistics ---

@router.get("/admin/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(admin: dict = Depends(get_current_admin)):
    db = get_db()
    
    users = list(db.collection("users").stream())
    total_voters = len(users)
    eligible_voters = sum(1 for u in users if u.to_dict().get("eligible", False))
    votes_cast = sum(1 for u in users if u.to_dict().get("voted", False))
    remaining_voters = max(0, eligible_voters - votes_cast)
    
    # Biometric templates
    verified_voters = len(list(db.collection("biometric_templates").stream()))
    
    # Audit counters
    audits = list(db.collection("audit_logs").stream())
    failed_verifications = sum(1 for a in audits if a.to_dict().get("action") == "BIOMETRIC_VERIFICATION" and a.to_dict().get("result") == "FAILURE")
    duplicate_attempts = sum(1 for a in audits if a.to_dict().get("action") == "DUPLICATE_VOTE_ATTEMPT")

    turnout = round((votes_cast / eligible_voters * 100), 1) if eligible_voters > 0 else 0.0
    
    # Active election details & aggregate candidate votes
    active_el_docs = list(db.collection("elections").where("status", "==", "active").stream())
    active_election = active_el_docs[0].to_dict() if active_el_docs else None
    
    candidate_results = []
    if active_election:
        el_id = active_election.get("election_id")
        cands = list(db.collection("candidates").where("election_id", "==", el_id).stream())
        ballots = list(db.collection("votes").where("election_id", "==", el_id).stream())
        total_ballots = len(ballots)
        
        cand_tally = {}
        for b in ballots:
            cid = b.to_dict().get("candidate_id")
            cand_tally[cid] = cand_tally.get(cid, 0) + 1
            
        for c in cands:
            c_data = c.to_dict()
            cid = c_data.get("candidate_id", c.id)
            c_votes = cand_tally.get(cid, 0)
            pct = round((c_votes / total_ballots * 100), 1) if total_ballots > 0 else 0.0
            candidate_results.append(CandidateVoteStat(
                candidate_id=cid,
                name=c_data.get("name", "Unknown"),
                party=c_data.get("party", "Independent"),
                symbol=c_data.get("symbol", "flag"),
                votes=c_votes,
                percentage=pct
            ))
            
    return DashboardStats(
        total_voters=total_voters,
        eligible_voters=eligible_voters,
        verified_voters=verified_voters,
        votes_cast=votes_cast,
        remaining_voters=remaining_voters,
        failed_verifications=failed_verifications,
        duplicate_attempts=duplicate_attempts,
        turnout_percentage=turnout,
        active_election=active_election,
        candidate_results=candidate_results
    )
