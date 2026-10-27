import time
import logging
from app.database.firebase import get_db
from app.core.config import settings
from app.core.security import hash_password, mask_aadhaar

logger = logging.getLogger("smart_voting.init_db")

def initialize_database():
    """Seeds initial admin, elections, and candidates into Firestore if not present."""
    db = get_db()
    
    # 1. Seed Admin
    admins_ref = db.collection("admins")
    existing_admin = list(admins_ref.where("email", "==", settings.DEFAULT_ADMIN_EMAIL).stream())
    if not existing_admin:
        admin_doc = {
            "admin_id": "ADMIN-001",
            "email": settings.DEFAULT_ADMIN_EMAIL,
            "name": settings.DEFAULT_ADMIN_NAME,
            "hashed_password": hash_password(settings.DEFAULT_ADMIN_PASSWORD),
            "role": "admin",
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        }
        admins_ref.document("ADMIN-001").set(admin_doc)
        logger.info(f"Default admin initialized: {settings.DEFAULT_ADMIN_EMAIL}")

    # 2. Seed Default Election
    elections_ref = db.collection("elections")
    existing_election = list(elections_ref.where("election_id", "==", "ELECTION-2026-DEMO").stream())
    if not existing_election:
        election_doc = {
            "election_id": "ELECTION-2026-DEMO",
            "name": "General Parliamentary Election 2026",
            "description": "Academic Multimodal Biometric Voting Prototype - Constituency 04",
            "start_time": "2026-09-01T08:00:00Z",
            "end_time": "2026-12-31T20:00:00Z",
            "status": "active",
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        }
        elections_ref.document("ELECTION-2026-DEMO").set(election_doc)
        logger.info("Demo Election seeded: ELECTION-2026-DEMO")

    # 3. Seed Candidates
    candidates_ref = db.collection("candidates")
    existing_cand = list(candidates_ref.where("election_id", "==", "ELECTION-2026-DEMO").stream())
    if not existing_cand:
        candidates = [
            {
                "candidate_id": "CAND-001",
                "election_id": "ELECTION-2026-DEMO",
                "name": "Dr. Rajesh Sharma",
                "party": "Progressive Democratic Alliance",
                "symbol": "Torch",
                "ballot_order": 1
            },
            {
                "candidate_id": "CAND-002",
                "election_id": "ELECTION-2026-DEMO",
                "name": "Ananya Iyer",
                "party": "National Innovation Party",
                "symbol": "Rocket",
                "ballot_order": 2
            },
            {
                "candidate_id": "CAND-003",
                "election_id": "ELECTION-2026-DEMO",
                "name": "Kabir Patel",
                "party": "United Green Coalition",
                "symbol": "Tree",
                "ballot_order": 3
            },
            {
                "candidate_id": "CAND-NOTA",
                "election_id": "ELECTION-2026-DEMO",
                "name": "None of the Above (NOTA)",
                "party": "Independent / Disapproval",
                "symbol": "Prohibition",
                "ballot_order": 4
            }
        ]
        for cand in candidates:
            candidates_ref.document(cand["candidate_id"]).set(cand)
        logger.info("Demo candidates seeded successfully.")

    # 4. Seed Sample Voters for testing
    users_ref = db.collection("users")
    sample_face = "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22260%22%20height%3D%22260%22%20viewBox%3D%220%200%20260%20260%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22bgGrad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230f172a%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%231e293b%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22badgeGrad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2306b6d4%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%233b82f6%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22260%22%20height%3D%22260%22%20fill%3D%22url%28%23bgGrad%29%22%20rx%3D%2216%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%22240%22%20height%3D%22240%22%20fill%3D%22none%22%20stroke%3D%22rgba%286%2C182%2C212%2C0.4%29%22%20stroke-width%3D%222%22%20rx%3D%2212%22%2F%3E%3Ccircle%20cx%3D%22130%22%20cy%3D%2295%22%20r%3D%2248%22%20fill%3D%22%23cbd5e1%22%2F%3E%3Cpath%20d%3D%22M%2050%20230%20C%2050%20170%2C%20210%20170%2C%20210%20230%20Z%22%20fill%3D%22%23334155%22%2F%3E%3Cpolygon%20points%3D%22130%2C190%20110%2C165%20150%2C165%22%20fill%3D%22%23f8fafc%22%2F%3E%3Cpolygon%20points%3D%22126%2C185%20134%2C185%20136%2C230%20124%2C230%22%20fill%3D%22%230284c7%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%2245%22%20r%3D%2218%22%20fill%3D%22url%28%23badgeGrad%29%22%2F%3E%3Ctext%20x%3D%22215%22%20y%3D%2251%22%20fill%3D%22%23ffffff%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22bold%22%20text-anchor%3D%22middle%22%3E%E2%9C%93%3C%2Ftext%3E%3Crect%20x%3D%2225%22%20y%3D%22212%22%20width%3D%22210%22%20height%3D%2224%22%20fill%3D%22rgba%2815%2C23%2C42%2C0.85%29%22%20rx%3D%226%22%2F%3E%3Ctext%20x%3D%22130%22%20y%3D%22228%22%20fill%3D%22%2338bdf8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2210%22%20font-weight%3D%22bold%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%220.5%22%3EREGISTERED%20OFFICIAL%20PHOTO%3C%2Ftext%3E%3C%2Fsvg%3E"
    sample_voters = [
        {
            "voter_id": "VOTER-1001",
            "name": "Aarav Mehta",
            "age": 28,
            "mobile": "9876543210",
            "aadhaar_last4": "4321",
            "eligible": True,
            "voted": False,
            "status": "active",
            "registered_face_image": sample_face,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "updated_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        },
        {
            "voter_id": "VOTER-1002",
            "name": "Pooja Verma",
            "age": 34,
            "mobile": "9876501234",
            "aadhaar_last4": "8765",
            "eligible": True,
            "voted": False,
            "status": "active",
            "registered_face_image": sample_face,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "updated_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        }
    ]
    for voter in sample_voters:
        doc = users_ref.document(voter["voter_id"]).get()
        if not doc.exists:
            users_ref.document(voter["voter_id"]).set(voter)
            logger.info(f"Sample voter {voter['voter_id']} seeded.")

if __name__ == "__main__":
    initialize_database()
