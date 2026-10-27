# Smart Biometric Voting System - UML & Architectural Diagrams

This document contains valid Mermaid diagrams representing all core engineering workflows of the Smart Biometric Voting System.

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Client ["Client Presentation Tier (React 19 + Vite)"]
        Kiosk["Voter Kiosk Interface\n(/vote, /vote/verify, /vote/ballot)"]
        AdminUI["Admin Management Console\n(/admin/dashboard, /admin/voters, /admin/elections)"]
        WebcamModule["Webcam Capture Engine\n(HTML5 Canvas API + Quality Filter)"]
    end

    subgraph API ["Application Tier (FastAPI Python 3.11)"]
        RouterAuth["Auth & JWT Guard\n(/api/auth/*)"]
        RouterVoters["Voter Registry CRUD\n(/api/admin/voters/*)"]
        RouterBio["Biometric Verification Engine\n(/api/biometric/*)"]
        RouterVoting["Anonymous Ballot Engine\n(/api/voting/*)"]
        RouterAudit["Audit Logger\n(/api/admin/audit-logs)"]
    end

    subgraph CV ["Computer Vision & Biometric Pipelines"]
        FaceEngine["Face Recognition Pipeline\n(OpenCV Haar + 512-d ArcFace Normalized Vector)"]
        IrisEngine["Iris Recognition Pipeline\n(Daugman Rubber Sheet + Gabor Phase Code)"]
        LivenessEngine["Liveness Challenge Engine\n(Blink / Motion Challenge)"]
    end

    subgraph DB ["Persistence Tier (Firebase Cloud Firestore)"]
        ColUsers[("users")]
        ColBio[("biometric_templates")]
        ColElections[("elections")]
        ColCandidates[("candidates")]
        ColSessions[("voting_sessions")]
        ColVotes[("votes (anonymous)")]
        ColAudits[("audit_logs")]
    end

    WebcamModule -->|Base64 JPEG Frame| RouterBio
    RouterBio --> FaceEngine
    RouterBio --> IrisEngine
    RouterBio --> LivenessEngine
    FaceEngine --> ColBio
    IrisEngine --> ColBio
    RouterBio --> ColUsers
    RouterBio --> ColSessions

    Kiosk -->|Cast Ballot with Session Token| RouterVoting
    RouterVoting --> ColSessions
    RouterVoting --> ColUsers
    RouterVoting -->|Atomic Store (No Voter ID)| ColVotes
    RouterVoting --> ColAudits

    AdminUI --> RouterAuth
    AdminUI --> RouterVoters
    RouterVoters --> ColUsers
    RouterAuth --> ColAudits
```

---

## 2. Voter Registration & Biometric Enrollment Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Election Officer
    participant UI as Admin Portal
    participant API as FastAPI Backend
    participant FaceCV as Face Engine
    participant IrisCV as Iris Engine
    participant FS as Firebase Firestore

    Admin->>UI: Enter Voter Info (Name, Age, Mobile, Aadhaar)
    Admin->>UI: Capture Live Camera Frame
    UI->>API: POST /api/admin/voters (Masks Aadhaar)
    API->>FS: Store in 'users' collection (eligible=true, voted=false)
    FS-->>API: Voter ID Assigned (e.g. VOTER-1001)

    UI->>API: POST /api/biometric/enroll-multimodal
    API->>FaceCV: Detect Face, Validate Brightness & Blur
    FaceCV-->>API: Extract 512-d ArcFace Normalised Vector
    API->>IrisCV: Segment Pupil & Iris Boundaries
    IrisCV-->>API: Generate Polar Strip & Binary IrisCode
    API->>FS: Store in 'biometric_templates'
    API->>FS: Append 'BIOMETRIC_ENROLLMENT' to 'audit_logs'
    API-->>UI: 200 OK (Enrollment Completed)
    UI-->>Admin: Show Success Confirmation
```

---

## 3. Multimodal Voting & Duplicate Prevention Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Voter as Registered Voter
    participant Kiosk as Voter Terminal
    participant API as FastAPI Backend
    participant Matcher as Multimodal Biometric Engine
    participant DB as Firebase Firestore

    Voter->>Kiosk: Step in front of terminal camera
    Kiosk->>API: Fetch Liveness Challenge ("Blink naturally")
    Voter->>Kiosk: Performs challenge
    Kiosk->>API: POST /api/biometric/verify-multimodal (Live Frame)
    API->>Matcher: 1:N Face Cosine Similarity + Iris Hamming Distance
    Matcher->>DB: Scan registered biometric_templates

    alt Match Found & voted == false
        Matcher-->>API: Match Confirmed (Voter Identified)
        API->>DB: Check voter eligibility (active & eligible=true)
        API->>DB: Create short-lived (5 min) Voting Session
        API-->>Kiosk: Return Session Token
        Kiosk->>Voter: Display Official Ballot
        Voter->>Kiosk: Select Candidate & Confirm Vote
        Kiosk->>API: POST /api/voting/cast (Session Token + Candidate ID)
        API->>DB: Atomic Transaction: Mark session used, mark voter voted=true, append anonymous vote
        API-->>Kiosk: Digital Receipt Hash (SHA-256)
        Kiosk-->>Voter: Display Success & Confetti
    else Match Found & voted == true (DUPLICATE ATTEMPT)
        Matcher-->>API: Match Confirmed (Voter Identified)
        API->>DB: Detect voted == true
        API->>DB: Log 'DUPLICATE_VOTE_ATTEMPT' in audit_logs
        API-->>Kiosk: 400 ALREADY_VOTED
        Kiosk-->>Voter: Display "ALREADY VOTED" Security Screen
    else No Match
        Matcher-->>API: Threshold not met
        API-->>Kiosk: 400 Verification Failed
        Kiosk-->>Voter: Rejection Notice
    end
```

---

## 4. Face Recognition Pipeline

```mermaid
flowchart LR
    Frame["Input Frame\n(RGB Webcam)"] --> Quality["Quality Check\n(Blur & Lighting)"]
    Quality --> Detection["Haar / DNN\nFace Detection"]
    Detection --> Check{"Single Face\nDetected?"}
    Check -->|No| Reject["Reject Frame\n(No Face / Multiple Faces)"]
    Check -->|Yes| Alignment["Affine Alignment\n& Normalization (112x112)"]
    Alignment --> Embedding["512-d Feature Extraction\n(ArcFace / Deep Projection)"]
    Embedding --> L2Norm["L2 Unit Vector\nNormalization"]
    L2Norm --> Cosine["Cosine Similarity\nCalculation"]
    Cosine --> Thresh{"Score >= 0.65\nThreshold?"}
    Thresh -->|Yes| Match["Identity Confirmed"]
    Thresh -->|No| NoMatch["Face Verification Failed"]
```

---

## 5. Iris Recognition Pipeline

```mermaid
flowchart LR
    Ocular["Eye Region\nCrop"] --> Quality["Ocular Quality Check\n(Laplacian Focus Score)"]
    Quality --> Pupil["Pupil Boundary Localization\n(Min Intensity + Hough / Contours)"]
    Pupil --> Limbic["Outer Iris Limbic\nBoundary Estimation"]
    Limbic --> Daugman["Daugman Rubber Sheet\nPolar Unwrapping (32x128)"]
    Daugman --> Filter["2D Gabor Wavelet\nPhase Quantization"]
    Filter --> IrisCode["Binary IrisCode\nHex Representation"]
    IrisCode --> HD["Fractional Hamming Distance\nHD = (Code1 XOR Code2) / Total"]
    HD --> HDCheck{"HD <= 0.38\nThreshold?"}
    HDCheck -->|Yes| IrisMatch["Iris Verified Authentic"]
    HDCheck -->|No| IrisNoMatch["Iris Rejected"]
```

---

## 6. Database Entity-Relationship Model (Firebase Collections)

```mermaid
erDiagram
    users {
        string voter_id PK
        string name
        int age
        string mobile
        string aadhaar_last4
        boolean eligible
        boolean voted
        string status
        timestamp created_at
    }

    biometric_templates {
        string voter_id PK, FK
        array face_embedding
        string iris_template
        string face_model_version
        string iris_model_version
        timestamp created_at
    }

    elections {
        string election_id PK
        string name
        string description
        timestamp start_time
        timestamp end_time
        string status
    }

    candidates {
        string candidate_id PK
        string election_id FK
        string name
        string party
        string symbol
        int ballot_order
    }

    voting_sessions {
        string session_id PK
        string voter_id FK
        string election_id FK
        string token
        timestamp expires_at
        boolean used
    }

    votes {
        string vote_id PK
        string election_id FK
        string candidate_id FK
        string receipt_hash
        timestamp timestamp
    }

    audit_logs {
        string log_id PK
        string action
        string result
        string actor
        json details
        string request_id
        timestamp timestamp
    }

    users ||--o| biometric_templates : "enrolled with"
    elections ||--o{ candidates : "lists"
    elections ||--o{ voting_sessions : "authorizes"
    elections ||--o{ votes : "tallies"
    candidates ||--o{ votes : "receives"
```

---

## 7. Data Flow Diagram (DFD Level 0 - Context Diagram)

```mermaid
flowchart TD
    Voter["Voter"] -->|Live Biometric Frame| System["Smart Biometric Voting System"]
    System -->|Ballot Options| Voter
    Voter -->|Candidate Selection| System
    System -->|Cryptographic Receipt| Voter

    Admin["Election Official"] -->|Admin Credentials| System
    Admin -->|Voter Registration Data| System
    Admin -->|Election & Candidate Setup| System
    System -->|Aggregate Turnout & Audit Reports| Admin
```

---

## 8. Data Flow Diagram (DFD Level 1)

```mermaid
flowchart TD
    subgraph DFD1 ["DFD Level 1: System Decomposition"]
        P1["1.0 Admin Authentication"]
        P2["2.0 Voter Registration & Masking"]
        P3["3.0 Biometric Template Generation"]
        P4["4.0 Multimodal Identity Verification"]
        P5["5.0 Anonymous Vote Processing"]
        P6["6.0 Audit & Analytics Logging"]

        D1[("users")]
        D2[("biometric_templates")]
        D3[("elections / candidates")]
        D4[("voting_sessions")]
        D5[("votes")]
        D6[("audit_logs")]
    end

    Admin["Admin"] -->|Credentials| P1
    P1 --> D6
    Admin -->|Voter Info| P2
    P2 -->|Masked Record| D1
    Admin -->|Face & Iris Capture| P3
    P3 -->|Feature Vector| D2

    Voter["Voter"] -->|Live Frame| P4
    P4 <--> D2
    P4 <--> D1
    P4 -->|Create Session| D4
    P4 --> D6

    Voter -->|Candidate Choice + Session Token| P5
    P5 <--> D4
    P5 -->|Update voted=true| D1
    P5 -->|Store Anonymous Ballot| D5
    P5 -->|Record Completion| D6
    P5 -->|Receipt Hash| Voter
```
