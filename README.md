# 🗳️ Smart Biometric Voting System

> **Academic Final-Year Project** — Multimodal Biometric (Face + Iris) Voting Kiosk with Firebase Firestore

A secure, privacy-preserving electronic voting prototype featuring **ArcFace-based facial recognition**, **Daugman IrisCode verification**, **challenge-response liveness detection**, and **cryptographic vote anonymity** — all powered by **Firebase Firestore**.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│           React 19 + Vite 8 Frontend            │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │ Admin Panel   │  │   Voter Kiosk (Public) │   │
│  │ /admin/*      │  │   /vote/*              │   │
│  └──────────────┘  └────────────────────────┘   │
│            ↕ Axios + JWT Bearer Auth             │
├─────────────────────────────────────────────────┤
│         FastAPI Backend (Python 3.12)            │
│  ┌──────┐ ┌───────┐ ┌──────────┐ ┌──────────┐  │
│  │ Auth │ │Voters │ │Biometric │ │ Voting   │  │
│  │ API  │ │ API   │ │   API    │ │  API     │  │
│  └──────┘ └───────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │Elections │ │  Audit   │ │  Face/Iris/Live  │ │
│  │   API    │ │  API     │ │   Services       │ │
│  └──────────┘ └──────────┘ └─────────────────┘ │
│            ↕ Firebase Admin SDK                  │
├─────────────────────────────────────────────────┤
│         Firebase Firestore Database              │
│  Collections: users, biometric_templates,        │
│  admins, elections, candidates, voting_sessions, │
│  votes, audit_logs                               │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.12+** with pip
- **Node.js 18+** with npm
- A webcam (for biometric enrollment/verification)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3. Access the Application

| URL | Purpose |
|-----|---------|
| `http://localhost:5173/` | Voter Kiosk (Public) |
| `http://localhost:5173/login` | Admin Login |
| `http://localhost:5173/admin/dashboard` | Admin Dashboard |
| `http://localhost:8000/docs` | API Documentation (Swagger) |
| `http://localhost:8000/redoc` | API Documentation (ReDoc) |

---

## 🔐 Default Admin Credentials

| Field | Value |
|-------|-------|
| **Email** | `admin@election.gov` |
| **Password** | `Admin@Voting2026!` |

---

## 📋 Features

### Admin Panel (`/admin/*`)
- **Dashboard** — Real-time election metrics, voter turnout progress, candidate vote tally
- **Voter Management** — Register, search, activate/deactivate, delete voters
- **Biometric Enrollment** — Face + Iris capture via webcam
- **Elections** — Create/edit/delete elections
- **Candidates** — Add/edit/remove candidates per election
- **Audit Logs** — Tamper-evident security event log viewer

### Voter Kiosk (`/vote/*`)
- **Landing** — Kiosk welcome screen with voting instructions
- **Biometric Verification** — Face + Iris 1:N identification with liveness
- **Ballot** — Anonymous candidate selection with confirmation modal
- **Vote Success** — Cryptographic receipt hash display with confetti
- **Already Voted** — Duplicate vote prevention screen

### Security Features
- 🔒 **bcrypt** password hashing (12 rounds)
- 🔑 **JWT** authentication with configurable expiry
- 🛡️ **One-Person-One-Vote** enforcement (server-side)
- 🎭 **Vote Anonymity** — ballots stored without voter identity
- 📝 **Audit Trail** — every action logged with automatic sensitive data redaction
- 🎯 **Liveness Detection** — challenge-response anti-spoofing

### Biometric Pipeline
- **Face**: OpenCV detection → ArcFace 512-d embedding → Cosine similarity matching
- **Iris**: Daugman segmentation → Gabor wavelet IrisCode → Hamming distance matching
- **Multimodal Fusion**: Both modalities must verify for kiosk access

---

## 🗂️ Project Structure

```
Voting System/
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI route handlers
│   │   │   ├── auth.py        # Admin login/logout/me
│   │   │   ├── voters.py      # CRUD voter management
│   │   │   ├── biometrics.py  # Enrollment & verification
│   │   │   ├── elections.py   # Elections + candidates + dashboard stats
│   │   │   ├── voting.py      # Ballot info & anonymous vote casting
│   │   │   └── audit.py       # Audit log retrieval
│   │   ├── core/          # Config, security, audit logger
│   │   ├── database/      # Firebase Firestore provider
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── services/      # Face, Iris, Liveness services
│   │   └── main.py        # FastAPI app entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # AuthContext (React Context)
│   │   ├── layouts/       # AdminLayout, KioskLayout
│   │   ├── pages/         # All page components
│   │   ├── services/      # Axios API client
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🔥 Firebase Configuration

The system uses **Firebase Firestore** with automatic fallback:

1. **Cloud Firestore** — Place your `serviceAccountKey.json` and set `FIREBASE_CREDENTIALS_PATH` in `.env`
2. **Local Firestore** (default) — Automatically uses a high-fidelity local provider (`firestore_local.json`) for development

### Environment Variables (`.env`)

```env
FIREBASE_CREDENTIALS_PATH=path/to/serviceAccountKey.json
FIREBASE_PROJECT_ID=your-project-id
JWT_SECRET=your-secret-key
DEFAULT_ADMIN_EMAIL=admin@election.gov
DEFAULT_ADMIN_PASSWORD=Admin@Voting2026!
```

---

## 🧪 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | — | Admin login |
| GET | `/api/auth/me` | JWT | Get admin profile |
| GET | `/api/admin/voters` | JWT | List all voters |
| POST | `/api/admin/voters` | JWT | Register new voter |
| POST | `/api/biometric/enroll-multimodal` | JWT | Enroll face + iris |
| POST | `/api/biometric/verify-multimodal` | — | Kiosk verification |
| GET | `/api/biometric/liveness-challenge` | — | Get liveness challenge |
| GET | `/api/voting/ballot-info` | Session | Get ballot candidates |
| POST | `/api/voting/cast` | Session | Cast anonymous vote |
| GET | `/api/elections` | — | List elections |
| GET | `/api/admin/dashboard/stats` | JWT | Dashboard analytics |
| GET | `/api/audit/logs` | JWT | Audit trail |

---

## 📄 License

Academic use only. Not intended for real government elections.
