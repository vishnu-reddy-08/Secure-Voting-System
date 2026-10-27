from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
import uuid
import time
from app.database.firebase import get_db
from app.api.auth import get_current_admin
from app.schemas.models import VoterCreate, VoterUpdate, VoterResponse
from app.core.security import mask_aadhaar
from app.core.audit_logger import log_audit_event

router = APIRouter(prefix="/admin/voters", tags=["Voter Management"])

@router.post("", response_model=VoterResponse)
def create_voter(voter_in: VoterCreate, admin: dict = Depends(get_current_admin)):
    db = get_db()
    users_ref = db.collection("users")
    
    # Generate clean sequential/unique Voter ID
    voter_num = len(list(users_ref.stream())) + 1001
    voter_id = f"VOTER-{voter_num}"
    
    # Check duplicate mobile
    existing_mobile = list(users_ref.where("mobile", "==", voter_in.mobile).stream())
    if existing_mobile:
        log_audit_event(
            action="VOTER_REGISTRATION",
            result="FAILURE",
            actor=admin["email"],
            error_type="DUPLICATE_MOBILE",
            details={"mobile": voter_in.mobile[-4:]}
        )
        raise HTTPException(status_code=400, detail="A voter with this mobile number is already registered.")

    masked_aadhaar = mask_aadhaar(voter_in.aadhaar_raw)
    
    now_str = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    voter_doc = {
        "voter_id": voter_id,
        "name": voter_in.name.strip(),
        "age": voter_in.age,
        "mobile": voter_in.mobile.strip(),
        "aadhaar_last4": masked_aadhaar.split("-")[-1],
        "eligible": voter_in.eligible,
        "voted": False,
        "status": "active",
        "registered_face_image": voter_in.face_image_base64,
        "created_at": now_str,
        "updated_at": now_str
    }
    
    users_ref.document(voter_id).set(voter_doc)
    
    log_audit_event(
        action="VOTER_REGISTRATION",
        result="SUCCESS",
        actor=admin["email"],
        details={"voter_id": voter_id, "name": voter_in.name}
    )
    
    return {**voter_doc, "biometric_enrolled": False}

@router.get("", response_model=List[VoterResponse])
def list_voters(
    search: Optional[str] = Query(None, description="Search by name or voter ID"),
    status: Optional[str] = Query(None, description="Filter by status (active/inactive)"),
    admin: dict = Depends(get_current_admin)
):
    db = get_db()
    voters = []
    bio_templates = {doc.id: True for doc in db.collection("biometric_templates").stream()}
    
    for doc in db.collection("users").stream():
        data = doc.to_dict()
        v_id = data.get("voter_id", doc.id)
        
        # Filtering
        if status and data.get("status") != status:
            continue
        if search:
            query = search.lower()
            name_match = query in data.get("name", "").lower()
            id_match = query in v_id.lower()
            if not (name_match or id_match):
                continue
                
        data["voter_id"] = v_id
        data["biometric_enrolled"] = v_id in bio_templates
        voters.append(data)
        
    # Sort by created_at descending
    voters.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return voters

@router.get("/{voter_id}", response_model=VoterResponse)
def get_voter(voter_id: str, admin: dict = Depends(get_current_admin)):
    db = get_db()
    doc = db.collection("users").document(voter_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Voter {voter_id} not found")
    
    data = doc.to_dict()
    data["voter_id"] = voter_id
    bio_doc = db.collection("biometric_templates").document(voter_id).get()
    data["biometric_enrolled"] = bio_doc.exists
    return data

@router.put("/{voter_id}", response_model=VoterResponse)
def update_voter(voter_id: str, voter_in: VoterUpdate, admin: dict = Depends(get_current_admin)):
    db = get_db()
    doc_ref = db.collection("users").document(voter_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Voter {voter_id} not found")
    
    current_data = doc.to_dict()
    update_fields = {}
    if voter_in.name is not None:
        update_fields["name"] = voter_in.name.strip()
    if voter_in.age is not None:
        update_fields["age"] = voter_in.age
    if voter_in.mobile is not None:
        update_fields["mobile"] = voter_in.mobile.strip()
    if voter_in.eligible is not None:
        update_fields["eligible"] = voter_in.eligible
    if voter_in.status is not None:
        update_fields["status"] = voter_in.status
        
    update_fields["updated_at"] = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    doc_ref.update(update_fields)
    
    current_data.update(update_fields)
    current_data["voter_id"] = voter_id
    bio_doc = db.collection("biometric_templates").document(voter_id).get()
    current_data["biometric_enrolled"] = bio_doc.exists
    
    log_audit_event(
        action="VOTER_UPDATE",
        result="SUCCESS",
        actor=admin["email"],
        details={"voter_id": voter_id, "updated_fields": list(update_fields.keys())}
    )
    return current_data

@router.delete("/{voter_id}")
def delete_voter(voter_id: str, admin: dict = Depends(get_current_admin)):
    db = get_db()
    doc_ref = db.collection("users").document(voter_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Voter not found")
        
    doc_ref.delete()
    # Also remove any enrolled biometric template
    db.collection("biometric_templates").document(voter_id).delete()
    
    log_audit_event(
        action="VOTER_DELETE",
        result="SUCCESS",
        actor=admin["email"],
        details={"voter_id": voter_id}
    )
    return {"message": f"Voter {voter_id} and corresponding biometrics deleted successfully"}

@router.post("/{voter_id}/activate")
def activate_voter(voter_id: str, admin: dict = Depends(get_current_admin)):
    db = get_db()
    doc_ref = db.collection("users").document(voter_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Voter not found")
    doc_ref.update({"status": "active", "eligible": True})
    return {"message": f"Voter {voter_id} activated"}

@router.post("/{voter_id}/deactivate")
def deactivate_voter(voter_id: str, admin: dict = Depends(get_current_admin)):
    db = get_db()
    doc_ref = db.collection("users").document(voter_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Voter not found")
    doc_ref.update({"status": "inactive", "eligible": False})
    return {"message": f"Voter {voter_id} deactivated"}

@router.post("/{voter_id}/reset-vote")
def reset_voter_vote(voter_id: str, admin: dict = Depends(get_current_admin)):
    """Academic testing helper: resets voted status to false for repeat testing."""
    db = get_db()
    doc_ref = db.collection("users").document(voter_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Voter not found")
    doc_ref.update({"voted": False})
    return {"message": f"Voter {voter_id} vote status reset to false for testing"}
