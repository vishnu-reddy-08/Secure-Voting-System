from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.database.firebase import get_db
from app.api.auth import get_current_admin
from app.schemas.models import AuditLogResponse

router = APIRouter(prefix="/admin/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action name"),
    result: Optional[str] = Query(None, description="Filter by result (SUCCESS/FAILURE/REJECTED)"),
    limit: int = Query(50, ge=1, le=200),
    admin: dict = Depends(get_current_admin)
):
    db = get_db()
    logs = []
    
    for doc in db.collection("audit_logs").stream():
        data = doc.to_dict()
        data["log_id"] = data.get("log_id", doc.id)
        
        if action and data.get("action") != action:
            continue
        if result and data.get("result") != result:
            continue
            
        logs.append(data)
        
    # Sort newest first
    logs.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
    return logs[:limit]
