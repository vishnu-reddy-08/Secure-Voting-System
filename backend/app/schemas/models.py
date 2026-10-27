from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    admin_name: str
    role: str

class AdminResponse(BaseModel):
    admin_id: str
    email: str
    name: str
    role: str
    created_at: str

class VoterCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., ge=18, le=120)
    mobile: str = Field(..., min_length=10, max_length=15)
    aadhaar_raw: str = Field(..., min_length=4, max_length=16)
    eligible: bool = True
    face_image_base64: Optional[str] = None

class VoterUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    mobile: Optional[str] = None
    eligible: Optional[bool] = None
    status: Optional[str] = None

class VoterResponse(BaseModel):
    voter_id: str
    name: str
    age: int
    mobile: str
    aadhaar_last4: str
    eligible: bool
    voted: bool
    status: str
    biometric_enrolled: bool = False
    registered_face_image: Optional[str] = None
    created_at: str
    updated_at: str

class ElectionCreate(BaseModel):
    election_id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    start_time: str
    end_time: str
    status: str = "active" # upcoming, active, completed

class ElectionResponse(BaseModel):
    election_id: str
    name: str
    description: str
    start_time: str
    end_time: str
    status: str
    candidate_count: int = 0
    total_votes: int = 0
    created_at: str

class CandidateCreate(BaseModel):
    candidate_id: Optional[str] = None
    election_id: str
    name: str
    party: str
    symbol: Optional[str] = "flag"
    ballot_order: int = 1

class CandidateResponse(BaseModel):
    candidate_id: str
    election_id: str
    name: str
    party: str
    symbol: str
    ballot_order: int

class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    party: Optional[str] = None
    symbol: Optional[str] = None
    ballot_order: Optional[int] = None

class FaceEnrollRequest(BaseModel):
    voter_id: str
    face_image_base64: str

class FaceVerifyRequest(BaseModel):
    face_image_base64: str

class IrisEnrollRequest(BaseModel):
    voter_id: str
    iris_image_base64: str

class IrisVerifyRequest(BaseModel):
    iris_image_base64: str

class BiometricEnrollRequest(BaseModel):
    voter_id: str
    face_image_base64: str
    iris_image_base64: Optional[str] = None

class BiometricVerifyRequest(BaseModel):
    face_image_base64: str
    iris_image_base64: Optional[str] = None
    election_id: Optional[str] = None

class BiometricVerifyResponse(BaseModel):
    success: bool
    voter_id: Optional[str] = None
    voter_name: Optional[str] = None
    message: str
    session_token: Optional[str] = None
    session_expires_at: Optional[float] = None
    face_verified: bool = False
    iris_verified: bool = False
    liveness_verified: bool = False
    reason: Optional[str] = None
    voter_details: Optional[Dict[str, Any]] = None

class VoteCastRequest(BaseModel):
    session_token: str
    candidate_id: str

class VoteCastResponse(BaseModel):
    success: bool
    receipt_hash: str
    timestamp: str
    message: str
    voter_details: Optional[Dict[str, Any]] = None

class AuditLogResponse(BaseModel):
    log_id: str
    action: str
    result: str
    actor: str
    details: Dict[str, Any]
    error_type: Optional[str] = None
    request_id: str
    timestamp: float
    created_at: str

class CandidateVoteStat(BaseModel):
    candidate_id: str
    name: str
    party: str
    symbol: str
    votes: int
    percentage: float

class DashboardStats(BaseModel):
    total_voters: int
    eligible_voters: int
    verified_voters: int
    votes_cast: int
    remaining_voters: int
    failed_verifications: int
    duplicate_attempts: int
    turnout_percentage: float
    active_election: Optional[Dict[str, Any]] = None
    candidate_results: List[CandidateVoteStat] = []
