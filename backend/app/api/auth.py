from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.database.firebase import get_db
from app.core.security import verify_password, create_access_token, decode_access_token
from app.core.audit_logger import log_audit_event
from app.schemas.models import AdminLogin, TokenResponse, AdminResponse
from app.core.config import settings
import time

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_admin(token: str = Depends(oauth2_scheme)) -> dict:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    db = get_db()
    admin_docs = list(db.collection("admins").where("email", "==", email).stream())
    if not admin_docs:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin account not found")
    
    admin_data = admin_docs[0].to_dict()
    admin_data["admin_id"] = admin_docs[0].id
    return admin_data

@router.post("/login", response_model=TokenResponse)
def login(credentials: AdminLogin):
    db = get_db()
    admin_docs = list(db.collection("admins").where("email", "==", credentials.email).stream())
    
    if not admin_docs:
        log_audit_event(
            action="ADMIN_LOGIN",
            result="FAILURE",
            actor=credentials.email,
            error_type="INVALID_CREDENTIALS"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    admin_data = admin_docs[0].to_dict()
    if not verify_password(credentials.password, admin_data.get("hashed_password", "")):
        log_audit_event(
            action="ADMIN_LOGIN",
            result="FAILURE",
            actor=credentials.email,
            error_type="INVALID_CREDENTIALS"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    token = create_access_token({"sub": admin_data["email"], "role": admin_data.get("role", "admin")})
    log_audit_event(
        action="ADMIN_LOGIN",
        result="SUCCESS",
        actor=credentials.email,
        details={"admin_id": admin_data.get("admin_id")}
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.JWT_EXPIRE_MINUTES * 60,
        "admin_name": admin_data.get("name", "Administrator"),
        "role": admin_data.get("role", "admin")
    }

@router.get("/me", response_model=AdminResponse)
def get_me(admin: dict = Depends(get_current_admin)):
    return {
        "admin_id": admin.get("admin_id", ""),
        "email": admin.get("email", ""),
        "name": admin.get("name", ""),
        "role": admin.get("role", "admin"),
        "created_at": admin.get("created_at", "")
    }

@router.post("/logout")
def logout(admin: dict = Depends(get_current_admin)):
    log_audit_event(
        action="ADMIN_LOGOUT",
        result="SUCCESS",
        actor=admin.get("email", "admin")
    )
    return {"message": "Successfully logged out"}
