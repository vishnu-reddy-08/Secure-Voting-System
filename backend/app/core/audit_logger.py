import uuid
import time
import logging
from typing import Optional, Dict, Any
from app.database.firebase import get_db

logger = logging.getLogger("smart_voting.audit")

def log_audit_event(
    action: str,
    result: str,
    actor: str = "system",
    details: Optional[Dict[str, Any]] = None,
    error_type: Optional[str] = None,
    request_id: Optional[str] = None
):
    """
    Appends a security audit entry into the Firestore audit_logs collection.
    Guarantees that sensitive data (passwords, raw biometrics, voter candidate selection) is excluded.
    """
    clean_details = (details or {}).copy()
    
    # Redact sensitive parameters if mistakenly passed
    redact_keys = ["password", "token", "face_image", "iris_image", "face_embedding", "iris_template", "candidate_id"]
    for k in list(clean_details.keys()):
        if any(bad in k.lower() for bad in redact_keys):
            del clean_details[k]

    event_id = str(uuid.uuid4())
    audit_entry = {
        "log_id": event_id,
        "action": action,
        "result": result, # "SUCCESS", "FAILURE", "REJECTED"
        "actor": actor,
        "details": clean_details,
        "error_type": error_type,
        "request_id": request_id or str(uuid.uuid4())[:8],
        "timestamp": time.time(),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    }

    try:
        db = get_db()
        db.collection("audit_logs").document(event_id).set(audit_entry)
        logger.info(f"AUDIT [{audit_entry['result']}] {action} by {actor}")
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")

    return audit_entry
