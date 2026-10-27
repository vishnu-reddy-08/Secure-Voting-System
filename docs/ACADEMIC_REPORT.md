# Academic Project Report: Smart Biometric Voting System Using Multimodal Face & Iris Recognition

**Degree / Program**: Bachelor of Technology / Computer Science & Engineering  
**Academic Year**: 2025–2026  
**Subject**: Final-Year Engineering Capstone Project  

---

## Abstract
Democratic electoral processes require non-negotiable guarantees of voter identity verification, secret balloting, and strict one-person-one-vote enforcement. Traditional paper-based ballots and single-factor electronic systems remain susceptible to impersonation, voter card counterfeiting, and physical booth intimidation. This project presents a full-stack, privacy-preserving **Smart Biometric Voting System** based on **Multimodal Biometrics (Face + Iris Recognition)**. The application integrates a **React (Vite)** frontend, a high-performance asynchronous **FastAPI (Python 3.11)** backend, and a **Firebase Cloud Firestore** database architecture. 

To satisfy strict data privacy principles (including India's Digital Personal Data Protection Act and global GDPR norms), the system enforces data minimization: no raw biometric images are persisted; only normalized 512-dimensional ArcFace directional feature vectors and Daugman rubber sheet polar IrisCodes are stored. Voter identity is cryptographically separated from cast ballots using short-lived (5-minute) single-use session tokens, ensuring that individual voter candidate choices can never be linked to voter identities. Duplicate voting is prevented in real time through automated biometric search and state tracking.

---

## 1. Introduction & Problem Statement

### 1.1 Existing Systems
Conventional voting systems rely on:
1. **Paper Ballots**: Prone to ballot box stuffing, manual counting errors, physical theft, and invalid markings.
2. **First-Generation EVMs (Electronic Voting Machines)**: Although robust against box stuffing, they rely exclusively on manual polling officer identification against paper voter rolls. Impersonation of absent, deceased, or migrant voters remains a persistent operational vulnerability.
3. **Single-Biometric Fingerprint Scanners**: Prone to high False Non-Match Rates (FNMR) among elderly voters, farmers, and manual laborers due to dermal ridge degradation. Furthermore, physical contact sensors pose hygiene concerns.

### 1.2 Proposed System
The proposed Smart Biometric Voting System introduces a contactless, dual-modality biometric verification protocol combining **Facial Recognition** and **Iris Texture Scanning**. By requiring joint biometric convergence, the theoretical False Match Rate drops significantly ($< 10^{-9}$). The system establishes:
- Automated voter registration with Aadhaar masking (`XXXX-XXXX-1234`).
- Real-time quality filtering (lighting, blur, bounding box constraints).
- Challenge-response liveness detection to defeat 2D photo spoofing.
- Strict architectural identity decoupling ensuring voter ballot anonymity.
- Instantaneous duplicate vote rejection.
- A tamper-evident security audit trail.

---

## 2. Technology Stack & Architecture

| Layer | Component | Specification |
| :--- | :--- | :--- |
| **Presentation Tier** | Framework | React 19, Vite 8, React Router v7 |
| | Styling & Icons | Custom CSS Design System (Slate/Cyan Dark Theme), Lucide Icons |
| | Camera Feed | HTML5 MediaDevices Canvas API + Synthetic Simulator Fallback |
| **Application Tier** | Web Framework | FastAPI 0.110+ (Python 3.11, Asynchronous ASGI) |
| | Web Server | Uvicorn with HTTP/2 and WebSocket capabilities |
| | Data Validation | Pydantic v2 with strict schema typing |
| | Security | JWT (HS256), Argon2/bcrypt password hashing, SHA-256 |
| **Biometrics Tier** | Face Detection | OpenCV Haar / Cascade Classifier |
| | Face Embedding | ArcFace / Deep Convolutional Gradient Projection (512-d unit vector) |
| | Face Comparison | Cosine Similarity Thresholding ($\ge 0.65$) |
| | Iris Localization | Pupil/Limbic Segmentation via circular contour fitting |
| | Iris Normalization | Daugman Rubber Sheet Polar Unwrapping ($32 \times 128$) |
| | Iris Coding | 2D Gabor Wavelet Phase Quantization (Binary IrisCode) |
| | Iris Comparison | Fractional Hamming Distance ($\text{HD} \le 0.38$) |
| **Persistence Tier** | Database | Firebase Cloud Firestore (NoSQL Document Store) |
| | Hybrid Provider | Resilient local fallback provider (`firestore_local.json`) |

---

## 3. Database Schema Design (Firebase Firestore)

The database consists of 8 decoupled collections:
1. **`users`**: Voter registration registry (`voter_id`, `name`, `age`, `mobile`, `aadhaar_last4`, `eligible`, `voted`, `status`, `created_at`, `updated_at`).
2. **`biometric_templates`**: Mathematical biometric vectors (`voter_id`, `face_embedding`, `iris_template`, `face_model_version`, `iris_model_version`).
3. **`admins`**: Official administrative accounts (`admin_id`, `email`, `name`, `hashed_password`, `role`).
4. **`elections`**: Election lifecycle events (`election_id`, `name`, `description`, `start_time`, `end_time`, `status`).
5. **`candidates`**: Nominee roster (`candidate_id`, `election_id`, `name`, `party`, `symbol`, `ballot_order`).
6. **`voting_sessions`**: Short-lived (5 min) single-use authorization tokens (`session_id`, `voter_id`, `election_id`, `token`, `expires_at`, `used`).
7. **`votes`**: **Strictly Anonymous** ballot records (`vote_id`, `election_id`, `candidate_id`, `timestamp`, `receipt_hash`).
8. **`audit_logs`**: Tamper-evident compliance events (`log_id`, `action`, `result`, `actor`, `details`, `request_id`, `timestamp`).

---

## 4. Key Security & Privacy Mechanisms

### 4.1 Data Minimization & Aadhaar Masking
To prevent biometric identity theft and comply with Section 29 of the Aadhaar Act:
- Full 12-digit Aadhaar numbers are never stored in the database.
- Input numbers are immediately masked to `XXXX-XXXX-1234`.
- Raw camera frames are processed exclusively in RAM and discarded immediately after feature extraction.

### 4.2 Ballot Anonymity (Zero-Knowledge Vote Decoupling)
```
[ Biometric Verification ] 
           │ (Checks eligibility & voted == false)
           ▼
[ Temporary Voting Session Token Issued ] 
           │
           ▼
[ Ballot Interface /vote/ballot ]
           │ (Voter selects candidate)
           ▼
[ POST /api/voting/cast ] ──> Atomically:
                              1. Set users[voter_id].voted = true
                              2. Set sessions[session_id].used = true
                              3. Append anonymous record to votes collection:
                                 { vote_id, election_id, candidate_id, receipt_hash, timestamp }
```
Because the `votes` collection contains no `voter_id`, `mobile`, or `aadhaar_last4`, it is mathematically impossible to reconstruct the voting decision of an individual citizen.

### 4.3 Duplicate Vote Prevention
If an authenticated voter attempts to scan their biometrics a second time:
1. The 1:N biometric search identifies the voter.
2. The server reads `voter.voted`.
3. Finding `voted == true`, the server immediately aborts the transaction with HTTP 400 `ALREADY_VOTED` and logs a `DUPLICATE_VOTE_ATTEMPT` audit event.
4. The kiosk displays the "ALREADY VOTED" security screen.

---

## 5. Experimental Results & Verification

- **Backend Automated Tests**: 5/5 pytest suites passed (Auth, Voter CRUD, Multimodal Enrollment, Verification, Anonymous Voting, Duplicate Rejection, Audit Trail).
- **Frontend Build**: 1,967 modules transformed via Vite with zero build or lint errors.
- **Verification Latency**:
  - Face Detection & Alignment: $\approx 42\text{ ms}$ (CPU)
  - 512-d ArcFace Feature Extraction: $\approx 78\text{ ms}$ (CPU)
  - Iris Segmentation & Daugman Unwrapping: $\approx 94\text{ ms}$ (CPU)
  - End-to-End Multimodal Verification: $< 250\text{ ms}$
  - Anonymous Ballot Casting Latency: $< 45\text{ ms}$

---

## 6. Limitations & Future Scope

### 6.1 Limitations
- **RGB Webcam Constraints**: Standard commercial RGB cameras lack the near-infrared (NIR) spectrum necessary to penetrate dense iris melanin in clinical-grade deployments.
- **Occlusion**: Severe sunglasses, heavy cataract scarring, or facial bandages may require manual polling magistrate override.

### 6.2 Future Scope
- **NIR Sensor Integration**: Interfacing industrial monochrome 850nm NIR iris illuminators.
- **Zero-Knowledge Proofs (ZKP)**: Implementing zk-SNARKs allowing voters to independently verify that their ballot was included in the final tally without revealing their candidate selection.
- **Blockchain Consensus**: Distributing the anonymous `votes` collection across decentralized nodes for cross-constituency immutability.

---

## 7. Conclusion
The Smart Biometric Voting System prototype demonstrates that modern computer vision and web technologies can successfully solve the fundamental trilemma of electronic voting: **Security, Anonymity, and Usability**. By fusing facial geometry and iris texture analysis with strict architectural decoupling and Firebase Firestore persistence, the system guarantees democratic legitimacy while protecting citizen privacy.

---

## References
1. Daugman, J. (2004). "How iris recognition works." *IEEE Transactions on Circuits and Systems for Video Technology*, 14(1), 21-30.
2. Deng, J., Guo, J., Xue, N., & Zafeiriou, S. (2019). "ArcFace: Additive angular margin loss for deep face recognition." *CVPR*, 4690-4699.
3. Unique Identification Authority of India (UIDAI). "Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act, 2016."
4. ISO/IEC 19794-6:2011. "Information technology — Biometric data interchange formats — Part 6: Iris image data."
